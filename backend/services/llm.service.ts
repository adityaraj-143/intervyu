import type { Socket } from "socket.io";
import { Conversation } from "../utils/conversation";
import Groq from "groq-sdk";
import { synthesizeSpeech } from "./tts.service";

const BOUNDARY_REGEX = /[.,!?;:]/;
const FLUSH_TIMEOUT_MS = 3000;

export async function callLLM(conversation: Conversation, socket: Socket): Promise<void> {
  const groq = new Groq();
  const stream = await getGroqChatStream(groq, conversation);

  let buffer = "";
  let lastFlushTime = Date.now();

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
      await synthesizeSpeech(sentence, socket);
    } else if (Date.now() - lastFlushTime > FLUSH_TIMEOUT_MS) {
      const lastPause = Math.max(
        buffer.lastIndexOf(","),
        buffer.lastIndexOf(";"),
        buffer.lastIndexOf(":"),
      );
      if (lastPause > 0) {
        const sentence = buffer.slice(0, lastPause + 1).trim();
        buffer = buffer.slice(lastPause + 1).trimStart();
        await synthesizeSpeech(sentence, socket);
      } else {
        const sentence = buffer.trim();
        buffer = "";
        await synthesizeSpeech(sentence, socket);
      }
      lastFlushTime = Date.now();
    }
  }

  if (buffer.trim()) {
    await synthesizeSpeech(buffer.trim(), socket);
  }
}

export async function getGroqChatStream(groq: Groq, conversation: Conversation) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `
        You are a conversational AI interviewer and assistant.

        The conversation history is provided as JSON messages with timestamps. Use the full history to maintain context, answer follow-up questions, reference previous discussion when relevant, and avoid asking for information already provided.

        Your responses will be converted to speech. Follow these rules:

        - Use natural, conversational language.
        - Keep responses concise unless the user requests detail.
        - Use proper punctuation to indicate pauses and sentence boundaries.
        - Prefer short paragraphs and complete sentences.
        - Avoid markdown, bullet points, tables, code blocks, emojis, and special formatting unless explicitly requested.
        - If asking multiple questions, separate them into distinct sentences.
        - Do not generate text that relies on visual formatting.
        - When referring to earlier messages, do so naturally and accurately.

        Respond with plain text only.
        `,
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
