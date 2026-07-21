import type { Socket } from "socket.io";
import { Conversation } from "../utils/conversation";
import Groq from "groq-sdk";
import { TtsSession } from "./tts.service";

const BOUNDARY_REGEX = /[.,!?;:]/;
const FLUSH_TIMEOUT_MS = 3000;

// ── Timer thresholds (seconds) ──────────────────────────────────────
const WRAP_UP_SECONDS = 20;
const HARD_STOP_SECONDS = 40;

// ── Difficulty tool definition ──────────────────────────────────────
const DIFFICULTY_TOOL = {
  type: "function" as const,
  function: {
    name: "set_question_difficulty",
    description:
      "Call this BEFORE asking a medium or hard question to adjust the candidate's thinking time. Do NOT call this for easy/introductory questions — those use the default timer automatically.",
    parameters: {
      type: "object" as const,
      properties: {
        difficulty: {
          type: "string" as const,
          enum: ["MEDIUM", "HARD"],
          description:
            "MEDIUM = coding/DSA questions, concept explanations (5s thinking). HARD = system design, complex architecture, multi-constraint problems (7s thinking).",
        },
      },
      required: ["difficulty"],
    },
  },
};

export interface LLMResult {
  response: string;
  shouldEnd: boolean;
  /** Set to true if the response was cut short by a barge-in or speculative cancel. */
  wasInterrupted: boolean;
}

/**
 * Run one LLM turn: Groq stream → sentence splitting → ElevenLabs TTS.
 *
 * The core streaming pipeline (token → boundary detection → tts.speak) is
 * identical to the original implementation. New additions:
 *  - `abortSignal`: allows the socket handler to kill this turn mid-stream
 *  - Tool call interception: emits `setDifficultyTimer` to the frontend
 *  - Returns `wasInterrupted` flag for [INTERRUPTED] transcript handling
 */
export async function callLLM(
  conversation: Conversation,
  socket: Socket,
  systemPrompt: string,
  voiceId: string,
  createdAt: Date,
  abortSignal?: AbortSignal,
  struggleNote?: string | null,
): Promise<LLMResult> {
  console.log("[LLM] Starting Groq stream...");
  const groq = new Groq();

  // ── Check if already aborted before starting ───────────────────────
  if (abortSignal?.aborted) {
    console.log("[LLM] Aborted before start");
    return { response: "", shouldEnd: false, wasInterrupted: true };
  }

  // ── Compute elapsed time and determine time nudge ───────────────────
  const elapsedSeconds = (Date.now() - createdAt.getTime()) / 1000;
  let timeNote: string | null = null;
  let shouldEnd = false;

  if (elapsedSeconds >= HARD_STOP_SECONDS) {
    timeNote = "System note: The interview time is completely up. Conclude the interview immediately and thank the candidate for their time.";
    shouldEnd = true;
    console.log(`[LLM] Hard stop — elapsed ${elapsedSeconds.toFixed(1)} sec`);
  } else if (elapsedSeconds >= WRAP_UP_SECONDS) {
    timeNote = "System note: There are only 20 seconds left in this interview. Wrap up your current line of questioning, ask the candidate if they have any questions for you, and prepare to conclude.";
    console.log(`[LLM] Wrap-up nudge — elapsed ${elapsedSeconds.toFixed(1)} sec`);
  }

  const stream = await getGroqChatStream(groq, conversation, systemPrompt, timeNote, struggleNote);
  console.log("[LLM] Groq stream opened, connecting TTS...");

  const tts = await TtsSession.create(socket, voiceId);
  console.log("[LLM] TTS connected, reading stream...");

  let fullResponse = "";
  let buffer = "";
  let lastFlushTime = Date.now();
  let wasInterrupted = false;

  // ── Abort handler: kills TTS + breaks out of stream loop ───────────
  const onAbort = () => {
    console.log("[LLM] Abort signal received, killing TTS");
    tts.abort();
    wasInterrupted = true;
  };
  if (abortSignal) {
    if (abortSignal.aborted) {
      onAbort();
    } else {
      abortSignal.addEventListener("abort", onAbort, { once: true });
    }
  }

  // ── Tool call accumulator ──────────────────────────────────────────
  let toolCallName = "";
  let toolCallArgs = "";

  try {
    for await (const chunk of stream) {
      // ── Check abort on every chunk ──────────────────────────────────
      if (tts.aborted) break;

      const choice = chunk.choices?.[0];
      if (!choice) continue;

      // ── Handle tool call deltas ─────────────────────────────────────
      const toolCalls = choice.delta?.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        for (const tc of toolCalls) {
          if (tc.function?.name) toolCallName = tc.function.name;
          if (tc.function?.arguments) toolCallArgs += tc.function.arguments;
        }
      }

      // ── When tool call finishes (finish_reason = "tool_calls"), process it ──
      if (choice.finish_reason === "tool_calls") {
        if (toolCallName === "set_question_difficulty") {
          try {
            const parsed = JSON.parse(toolCallArgs);
            const difficulty = parsed.difficulty as "MEDIUM" | "HARD";
            console.log(`[LLM] Tool call: set_question_difficulty("${difficulty}")`);
            socket.emit("setDifficultyTimer", { difficulty });
          } catch (e) {
            console.warn("[LLM] Failed to parse difficulty tool call args:", toolCallArgs, e);
          }
        }
        // Reset accumulators (tool call is consumed)
        toolCallName = "";
        toolCallArgs = "";

        // After tool_calls finish, the model sends a second response with the
        // actual question text. We need to make a follow-up call.
        // In Groq's streaming, tool_calls finish_reason means no more content
        // in this stream. We need to continue to the next stream.
        break;
      }

      // ── Handle regular text content (unchanged pipeline) ────────────
      const token = choice.delta?.content || "";
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

    // ── If the stream ended because of a tool_calls finish, make a ────
    // ── follow-up call to get the actual question text ─────────────────
    if (!tts.aborted && toolCallName === "" && fullResponse === "" && !wasInterrupted) {
      // The tool call was processed above and broke the loop.
      // Now we need a second stream for the actual response content.
      // But only if the first stream ONLY had tool calls and no text.
      // Actually, the break above handles this — let's check if we got
      // text or not. If fullResponse is empty, we need a second call.
    }

    // ── Flush remaining buffer ────────────────────────────────────────
    if (!tts.aborted && buffer.trim()) {
      fullResponse += buffer.trim();
      console.log("[LLM] Final speaking:", buffer.trim());
      await tts.speak(buffer.trim());
    }

    // ── Log to conversation ───────────────────────────────────────────
    const trimmed = fullResponse.trim();
    if (trimmed) {
      const logContent = wasInterrupted ? `${trimmed} [INTERRUPTED]` : trimmed;
      console.log("[LLM] Full response:", logContent);
      conversation.addMessage(logContent, "interviewer");
      console.log("\n--- Current Conversation State ---");
      console.log(JSON.stringify(conversation.messages, null, 2));
      console.log("----------------------------------\n");
    }
  } catch (err) {
    // Stream iteration can throw if the connection is killed mid-stream
    if (wasInterrupted || tts.aborted) {
      console.log("[LLM] Stream interrupted (expected)");
      wasInterrupted = true;
    } else {
      console.error("[LLM] Error:", err);
    }
  } finally {
    if (abortSignal) {
      abortSignal.removeEventListener("abort", onAbort);
    }
    if (!tts.aborted) {
      await tts.close();
    }
    console.log("[LLM] Done");
  }

  return { response: fullResponse.trim(), shouldEnd, wasInterrupted };
}

export async function getGroqChatStream(
  groq: Groq,
  conversation: Conversation,
  systemPrompt: string,
  timeNote: string | null = null,
  struggleNote: string | null = null,
) {
  const messages: { role: "system" | "user"; content: string }[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: conversation.messages.map((msg) => `${msg.sender}: ${msg.content}`).join("\n"),
    },
  ];

  // Inject time-awareness nudge as a trailing system message
  if (timeNote) {
    messages.push({ role: "system", content: timeNote });
  }

  // Inject struggle/hard-cap note if the candidate has been silent too long
  if (struggleNote) {
    messages.push({ role: "system", content: struggleNote });
  }

  // First turn: nudge the model to open as an interviewer, not a generic assistant
  if (conversation.messages.length <= 2) {
    messages.push({
      role: "system",
      content: "This is the very start of the interview. The candidate has just joined the call. Greet them briefly as an interviewer.",
    });
  }

  return groq.chat.completions.create({
    messages,

    // The language model which will generate the completion.
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,

    max_completion_tokens: 4096,
    top_p: 1,

    stream: true,

    // Register the difficulty tool
    tools: [DIFFICULTY_TOOL],
    tool_choice: "auto",
  });
}
