import { Socket } from "socket.io";
import type { SpeechClient } from "@google-cloud/speech";
import { Conversation } from "../utils/conversation";
import { callLLM } from "../services/llm.service";
import { db } from "../db";
import { MessageRole, InterviewStatus } from "../generated/prisma/enums";

export function registerSocketHandlers(
  socket: Socket,
  speechClient: SpeechClient
): void {
  const conversation = new Conversation();

  let interviewId: string | null = null;
  let systemPrompt: string | null = null;
  let voiceId: string | null = null;
  let createdAt: Date | null = null;
  let interviewEnded = false;

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
      createdAt = interview.createdAt;
      console.log(`[socket] Joined interview ${interviewId} (created at ${createdAt.toISOString()})`);
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
    if (!systemPrompt || !createdAt) {
      console.warn("[socket] No systemPrompt/createdAt — joinInterview not received yet.");
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

    const { response: llmResponse, shouldEnd } = await callLLM(conversation, socket, systemPrompt, voiceId || "JBFqnCBsd6RMkjVDRZzb", createdAt);

    // Persist both sides to DB
    if (interviewId) {
      await db.message.createMany({
        data: [
          { interviewId, role: MessageRole.Interviewee, content: userTranscript },
          { interviewId, role: MessageRole.Interviewer, content: llmResponse },
        ],
      });

      // If the LLM turn hit the hard stop, complete the interview
      if (shouldEnd) {
        interviewEnded = true;
        await db.interview.update({
          where: { id: interviewId },
          data: { status: InterviewStatus.Completed },
        });
        console.log(`[socket] Interview ${interviewId} completed (time expired)`);
        socket.emit("interviewEnded", { reason: "time_expired" });
        return; // Don't emit readyForAnswer
      }
    }
  }

  function resetSilenceTimer() {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(async () => {
      if (!fullMessage || isProcessing || interviewEnded) return;
      isProcessing = true;

      console.log("Final transcript:", fullMessage);
      await runLLMTurn();

      isProcessing = false;
      if (!interviewEnded) {
        socket.emit("readyForAnswer");
      }
    }, 3500);
  }

  function clearSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  }

  socket.on("audioChunk", (chunk: Buffer) => {
    if (interviewEnded) return;
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
    if (interviewEnded) return;
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
    if (!interviewEnded) {
      socket.emit("readyForAnswer"); // tell frontend to start recording again
    }
  });

  // ── Force-end fallback (triggered by frontend if backend didn't end in time)
  socket.on("forceEndInterview", async () => {
    if (interviewEnded || !interviewId) return;
    interviewEnded = true;
    console.log(`[socket] Force-ending interview ${interviewId}`);

    clearSilenceTimer();
    if (recognizeStream) {
      recognizeStream.destroy();
      recognizeStream = null;
    }

    await db.interview.update({
      where: { id: interviewId },
      data: { status: InterviewStatus.Completed },
    });

    socket.emit("interviewEnded", { reason: "force_ended" });
  });
}
