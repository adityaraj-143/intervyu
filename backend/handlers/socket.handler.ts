import { Socket } from "socket.io";
import type { SpeechClient } from "@google-cloud/speech";
import { Conversation } from "../utils/conversation";
import { callLLM } from "../services/llm.service";

export function registerSocketHandlers(
  socket: Socket,
  speechClient: SpeechClient
): void {
  const conversation = new Conversation();

  let fullMessage = "";
  let utterances: string[] = [];
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let isProcessing = false;
  let recognizeStream: ReturnType<SpeechClient["streamingRecognize"]> | null = null;

  function startRecognizeStream() {
    if (recognizeStream) return;
    recognizeStream = speechClient
      .streamingRecognize({
        config: {
          encoding: "WEBM_OPUS",
          sampleRateHertz: 48000,
          languageCode: "en-US",
          enableAutomaticPunctuation: true,
        },
        interimResults: true,
      })
      .on("error", (err) => {
        console.error("STT Error:", err);
        socket.emit("stt-error", err.message);
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
    silenceTimer = setTimeout(() => {
      if (!fullMessage || isProcessing) return;
      isProcessing = true;

      console.log("Final transcript:", fullMessage);
      conversation.addMessage(fullMessage, "interviewee");
      fullMessage = "";
      utterances = [];

      callLLM(conversation, socket).finally(() => {
        isProcessing = false;
      });
    }, 3500);
  }

  function clearSilenceTimer() {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
  }

  socket.on("audioChunk", (chunk: ArrayBuffer) => {
    console.log("[audioChunk] received", chunk.byteLength, "bytes");
    startRecognizeStream();
    if (!recognizeStream) return;
    recognizeStream.write(Buffer.from(chunk));
    resetSilenceTimer();
  });

  socket.on("stopRecording", () => {
    clearSilenceTimer();
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearSilenceTimer();
  });

  socket.on("answerDone", async () => {
    clearSilenceTimer();
    if (isProcessing) return;
    isProcessing = true;

    console.log("Final transcript:", fullMessage);
    conversation.addMessage(fullMessage, "interviewee");
    fullMessage = "";
    utterances = [];

    await callLLM(conversation, socket);
    isProcessing = false;
  });
}
