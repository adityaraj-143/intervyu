import { Socket } from "socket.io";
import type { SpeechClient } from "@google-cloud/speech";
import { Conversation } from "../utils/conversation";
import { callLLM } from "../services/llm.service";
import { db } from "../db";
import { MessageRole } from "../generated/prisma/enums";

export function registerSocketHandlers(
  socket: Socket,
  speechClient: SpeechClient
): void {
  const conversation = new Conversation();

  let interviewId: string | null = null;
  let systemPrompt: string | null = null;
  let voiceId: string | null = null;

  let sampleRate = 48000; // updated by sttConfig event from frontend
  let fullMessage = "";
  let utterances: string[] = [];
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let isProcessing = false;
  let recognizeStream: ReturnType<SpeechClient["streamingRecognize"]> | null = null;

  // ── Join: load interview context from DB ──────────────────────────────────
  socket.on("joinInterview", async ({ interviewId: id }: { interviewId: string }) => {
    try {
      const interview = await db.interview.findUniqueOrThrow({ where: { id } });
      interviewId = interview.id;
      systemPrompt = interview.systemPrompt;
      voiceId = interview.voiceId;
      console.log(`[socket] Joined interview ${interviewId}`);
    } catch {
      console.error(`[socket] Interview ${id} not found`);
      socket.emit("error", { message: "Interview not found" });
    }
  });

  socket.on("sttConfig", ({ sampleRate: rate }: { sampleRate: number }) => {
    sampleRate = rate;
    console.log(`[STT] Sample rate set to ${sampleRate} Hz`);
  });

  function startRecognizeStream() {
    if (recognizeStream) return;
    recognizeStream = speechClient
      .streamingRecognize({
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          languageCode: "en-US",
          enableAutomaticPunctuation: true,
        },
        interimResults: true,
      })
      .on("error", (err) => {
        console.error("STT Error:", err);
        socket.emit("stt-error", err.message);
        recognizeStream = null; // allow a fresh stream on next audioChunk
      })
      .on("data", (data) => {
        const transcript = data.results?.[0]?.alternatives?.[0]?.transcript ?? "";

        const isFinal = data.results?.[0]?.isFinal ?? false;

        console.log(`[STT] ${transcript} (${isFinal ? "FINAL" : "INTERIM"})`);
        if (isFinal && transcript) {
          utterances.push(transcript);
        }
        fullMessage = utterances.join(" ");
      });
  }

  async function runLLMTurn() {
    if (!systemPrompt) {
      console.warn("[socket] No systemPrompt — joinInterview not received yet.");
      socket.emit("readyForAnswer");
      return;
    }

    const userTranscript = fullMessage;
    conversation.addMessage(userTranscript, "interviewee");
    fullMessage = "";
    utterances = [];

    // close stale stream before LLM (no audio during TTS anyway)
    if (recognizeStream) {
      recognizeStream.destroy();
      recognizeStream = null;
    }

    const llmResponse = await callLLM(conversation, socket, systemPrompt, voiceId || "JBFqnCBsd6RMkjVDRZzb");

    // Persist both sides to DB
    if (interviewId) {
      await db.message.createMany({
        data: [
          { interviewId, role: MessageRole.Interviewee, content: userTranscript },
          { interviewId, role: MessageRole.Interviewer, content: llmResponse },
        ],
      });
    }
  }

  function resetSilenceTimer() {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(async () => {
      if (!fullMessage || isProcessing) return;
      isProcessing = true;

      console.log("Final transcript:", fullMessage);
      await runLLMTurn();

      isProcessing = false;
      socket.emit("readyForAnswer");
    }, 3500);
  }

  function clearSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  }

  socket.on("audioChunk", (chunk: Buffer) => {
    startRecognizeStream();
    if (!recognizeStream) return;
    recognizeStream.write(chunk);
    resetSilenceTimer();
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearSilenceTimer();
    if (recognizeStream) {
      recognizeStream.destroy();
      recognizeStream = null;
    }
  });

  socket.on("answerDone", async () => {
    clearSilenceTimer();
    if (isProcessing) return;
    isProcessing = true;

    // close stale stream — no audio during TTS playback
    if (recognizeStream) {
      recognizeStream.destroy();
      recognizeStream = null;
    }

    if (!fullMessage.trim()) {
      console.log("Empty transcript, ignoring answerDone.");
      isProcessing = false;
      socket.emit("readyForAnswer");
      return;
    }

    console.log("Final transcript:", fullMessage);
    await runLLMTurn();

    isProcessing = false;
    socket.emit("readyForAnswer"); // tell frontend to start recording again
  });
}
