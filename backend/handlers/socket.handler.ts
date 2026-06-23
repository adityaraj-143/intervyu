import { Socket } from "socket.io";
import type { SpeechClient } from "@google-cloud/speech";
import { Conversation } from "../utils/conversation";
import { callLLM } from "../services/llm.service";

export function registerSocketHandlers(
  socket: Socket,
  speechClient: SpeechClient
): void {
  const conversation = new Conversation();

  let sampleRate = 48000; // updated by sttConfig event from frontend
  let fullMessage = "";
  let utterances: string[] = [];
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let isProcessing = false;
  let recognizeStream: ReturnType<SpeechClient["streamingRecognize"]> | null = null;

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
          sampleRateHertz: sampleRate,
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

  function resetSilenceTimer() {
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(async () => {
      if (!fullMessage || isProcessing) return;
      isProcessing = true;

      console.log("Final transcript:", fullMessage);
      conversation.addMessage(fullMessage, "interviewee");
      fullMessage = "";
      utterances = [];

      // close stale stream before LLM (no audio during TTS anyway)
      if (recognizeStream) {
        recognizeStream.destroy();
        recognizeStream = null;
      }

      await callLLM(conversation, socket);
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

    console.log("Final transcript:", fullMessage);
    conversation.addMessage(fullMessage, "interviewee");
    fullMessage = "";
    utterances = [];

    await callLLM(conversation, socket);
    isProcessing = false;
    socket.emit("readyForAnswer"); // tell frontend to start recording again
  });
}
