import type { Socket } from "socket.io";
import { Conversation } from "../utils/conversation";
import Groq from "groq-sdk";
import { TtsSession } from "./tts.service";

const BOUNDARY_REGEX = /[.,!?;:]/;
const FLUSH_TIMEOUT_MS = 3000;

export async function callLLM(conversation: Conversation, socket: Socket, systemPrompt: string, voiceId: string): Promise<string> {
  console.log("[LLM] Starting Groq stream...");
  const groq = new Groq();
  const stream = await getGroqChatStream(groq, conversation, systemPrompt);
  console.log("[LLM] Groq stream opened, connecting TTS...");

  const tts = await TtsSession.create(socket, voiceId);
  console.log("[LLM] TTS connected, reading stream...");

  let fullResponse = "";
  let buffer = "";
  let lastFlushTime = Date.now();

  try {
    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content || "";
      if (!token) continue;

      buffer += token;

      const match = buffer.match(BOUNDARY_REGEX);
      if (match) {
        const idx = match.index! + 1;
        const sentence = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx).trimStart();
        lastFlushTime = Date.now();
        fullResponse += sentence + " ";
        console.log("[LLM] Speaking:", sentence);
        await tts.speak(sentence);
      } else if (Date.now() - lastFlushTime > FLUSH_TIMEOUT_MS) {
        const lastPause = Math.max(
          buffer.lastIndexOf(","),
          buffer.lastIndexOf(";"),
          buffer.lastIndexOf(":"),
        );
        if (lastPause > 0) {
          const sentence = buffer.slice(0, lastPause + 1).trim();
          buffer = buffer.slice(lastPause + 1).trimStart();
          fullResponse += sentence + " ";
          console.log("[LLM] Flush speaking:", sentence);
          await tts.speak(sentence);
        } else {
          const sentence = buffer.trim();
          buffer = "";
          fullResponse += sentence + " ";
          console.log("[LLM] Timeout speaking:", sentence);
          await tts.speak(sentence);
        }
        lastFlushTime = Date.now();
      }
    }

    if (buffer.trim()) {
      fullResponse += buffer.trim();
      console.log("[LLM] Final speaking:", buffer.trim());
      await tts.speak(buffer.trim());
    }

    console.log("[LLM] Full response:", fullResponse.trim());
    conversation.addMessage(fullResponse.trim(), "interviewer");
    console.log("\n--- Current Conversation State ---");
    console.log(JSON.stringify(conversation.messages, null, 2));
    console.log("----------------------------------\n");
  } catch (err) {
    console.error("[LLM] Error:", err);
  } finally {
    await tts.close();
    console.log("[LLM] Done");
  }

  return fullResponse.trim();
}

export async function getGroqChatStream(groq: Groq, conversation: Conversation, systemPrompt: string) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: conversation.messages.map((msg) => `${msg.sender}: ${msg.content}`).join("\n"),
      },
    ],

    // The language model which will generate the completion.
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,

    max_completion_tokens: 4096,
    top_p: 1,

    stream: true,
  });
}
