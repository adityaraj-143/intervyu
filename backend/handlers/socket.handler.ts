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

  const recognizeStream = speechClient
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

  socket.on("audioChunk", (chunk: ArrayBuffer) => {
    recognizeStream.write(Buffer.from(chunk));
  });

  socket.on("stopRecording", () => {
    recognizeStream.end();
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    recognizeStream.end();
  });

  socket.on("answerDone", () => {
    console.log("Final transcript:", fullMessage);
    conversation.addMessage(fullMessage, "interviewee");
    fullMessage = "";
    utterances = [];

    callLLM(conversation);
  });
}
