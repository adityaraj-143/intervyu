import { Socket } from "socket.io";
import type { SpeechClient } from "@google-cloud/speech";
import { Conversation } from "../utils/conversation";
import { callLLM } from "../services/llm.service";
import { db } from "../db";
import { MessageRole, InterviewStatus } from "../generated/prisma/enums";

// ── Struggle note injected when candidate hits the hard cap ──────────
const STRUGGLE_NOTE =
  "System note: The candidate has been silent for an extended period. " +
  "They may be struggling with this question. " +
  "Either gently simplify the current question to make it more approachable, " +
  "or pivot naturally to a different question — your choice based on context. " +
  "If they attempted any part of an answer, lean toward simplifying. " +
  "If they said nothing at all, lean toward pivoting.";

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
  let isProcessing = false;
  let recognizeStream: ReturnType<SpeechClient["streamingRecognize"]> | null = null;

  // ── Speculative processing state ────────────────────────────────────
  let speculativeAbort: AbortController | null = null;
  let speculativeCommitTimer: ReturnType<typeof setTimeout> | null = null;
  let isSpeculating = false;

  // ── Barge-in state ──────────────────────────────────────────────────
  let currentLLMAbort: AbortController | null = null;

  // ── Hard cap state ──────────────────────────────────────────────────
  let hitHardCap = false;

  // ── Join: load interview context from DB ──────────────────────────────────
  socket.on("joinInterview", async ({ interviewId: id }: { interviewId: string }) => {
    try {
      const interview = await db.interview.findUniqueOrThrow({ where: { id } });

      // ── IDOR Protection Check ──────────────────────────────────────
      // Ensure the authenticated user owns this interview session.
      const currentUser = socket.data.user;
      if (!currentUser || interview.userId !== currentUser.userId) {
        console.warn(`[socket] Unauthorized attempt to join interview ${id} by user ${currentUser?.userId}`);
        socket.emit("error", { message: "Unauthorized access to this interview session" });
        socket.disconnect();
        return;
      }

      interviewId = interview.id;
      systemPrompt = interview.systemPrompt;
      voiceId = interview.voiceId;
      createdAt = interview.createdAt;
      console.log(`[socket] User ${currentUser.userId} joined interview ${interviewId} (created at ${createdAt.toISOString()})`);
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

  /**
   * Run one full LLM turn: finalize transcript → call LLM → TTS → persist.
   * 
   * This is the same core flow as before, but now:
   *  - Accepts an AbortController so callers can cancel mid-stream
   *  - Accepts a struggleNote for hard-cap scenarios
   *  - Handles the `wasInterrupted` flag for barge-in transcript logging
   */
  async function runLLMTurn(abort: AbortController, struggleNote?: string | null) {
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

    // Store the abort controller so bargeIn can use it
    currentLLMAbort = abort;

    const { response: llmResponse, shouldEnd, wasInterrupted } = await callLLM(
      conversation,
      socket,
      systemPrompt,
      voiceId || "JBFqnCBsd6RMkjVDRZzb",
      createdAt,
      abort.signal,
      struggleNote,
    );

    currentLLMAbort = null;

    // If interrupted by barge-in, don't persist or emit readyForAnswer —
    // the bargeIn handler manages the transition back to listening
    if (wasInterrupted) {
      console.log("[socket] LLM turn was interrupted");
      // Persist partial data if we have it
      if (interviewId && llmResponse) {
        await db.message.createMany({
          data: [
            { interviewId, role: MessageRole.Interviewee, content: userTranscript },
            { interviewId, role: MessageRole.Interviewer, content: llmResponse + " [INTERRUPTED]" },
          ],
        });
      } else if (interviewId && userTranscript) {
        // Persist at least the user's message
        await db.message.create({
          data: { interviewId, role: MessageRole.Interviewee, content: userTranscript },
        });
      }
      return;
    }

    // Persist both sides to DB (unchanged logic)
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
        socket.emit("interviewEnded", { reason: "time_expired", interviewId });
        return; // Don't emit readyForAnswer
      }
    }
  }

  // ── Speculative Processing ─────────────────────────────────────────
  // 
  // Frontend sends `speculativeStart` after 2.5s of silence.
  // We immediately begin LLM processing but hold the response.
  // The frontend has a grace period during which it can cancel.
  //
  // The "holding" is handled by NOT emitting readyForAnswer until
  // the grace period closes (frontend sends `speculativeCommit`).
  // The TTS audio streams to the frontend but the frontend buffers
  // it during the grace period and only starts playback on commit.

  socket.on("speculativeStart", async () => {
    if (interviewEnded || isProcessing || isSpeculating) return;
    if (!fullMessage.trim()) {
      console.log("[speculative] Empty transcript, ignoring speculativeStart");
      return;
    }

    console.log("[speculative] Starting speculative LLM processing");
    isSpeculating = true;
    isProcessing = true;
    hitHardCap = false;

    // Create abort controller for this speculative run
    speculativeAbort = new AbortController();
    const abort = speculativeAbort;

    // Run the LLM turn (this will stream TTS audio to the frontend,
    // but the frontend will buffer it until it receives `speculativeCommit`)
    await runLLMTurn(abort, hitHardCap ? STRUGGLE_NOTE : null);

    isProcessing = false;
    isSpeculating = false;
    speculativeAbort = null;

    // If it wasn't interrupted (user didn't cancel), emit readyForAnswer
    if (!abort.signal.aborted && !interviewEnded) {
      socket.emit("readyForAnswer");
    }
  });

  socket.on("speculativeCancel", () => {
    if (!isSpeculating || !speculativeAbort) return;
    console.log("[speculative] Cancelling speculative processing");

    speculativeAbort.abort();
    speculativeAbort = null;
    isSpeculating = false;
    // isProcessing will be set to false when runLLMTurn returns
    // (the abort signal causes it to exit early)

    // Clear any pending commit timer
    if (speculativeCommitTimer) {
      clearTimeout(speculativeCommitTimer);
      speculativeCommitTimer = null;
    }
  });

  // ── Hard Cap Signal ────────────────────────────────────────────────
  // Frontend sends this when the candidate has been silent for 9s total
  socket.on("hardCapReached", () => {
    console.log("[socket] Hard cap reached — candidate may be struggling");
    hitHardCap = true;
  });

  // ── Barge-In ───────────────────────────────────────────────────────
  // Frontend sends this when the user starts speaking while AI is talking
  socket.on("bargeIn", () => {
    if (interviewEnded) return;
    console.log("[bargeIn] User is barging in — aborting current LLM/TTS");

    // Abort the current LLM turn (which also aborts TTS via the abort handler)
    if (currentLLMAbort) {
      currentLLMAbort.abort();
    }

    // The interrupted response is logged with [INTERRUPTED] by callLLM
    // The frontend will stop TTS playback when it receives `ttsStop`
    // and transition to listening mode

    // After a brief delay, signal frontend to start recording again
    // (the user is already speaking, so we want to capture their audio)
    setTimeout(() => {
      if (!interviewEnded) {
        isProcessing = false;
        socket.emit("readyForAnswer");
      }
    }, 100);
  });

  // ── Audio chunk handling (unchanged) ───────────────────────────────
  socket.on("audioChunk", (chunk: Buffer) => {
    if (interviewEnded) return;
    startRecognizeStream();
    if (!recognizeStream) return;
    recognizeStream.write(chunk);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    if (speculativeAbort) speculativeAbort.abort();
    if (currentLLMAbort) currentLLMAbort.abort();
    if (speculativeCommitTimer) clearTimeout(speculativeCommitTimer);
    if (recognizeStream) {
      recognizeStream.destroy();
      recognizeStream = null;
    }
  });

  // ── answerDone (kept as a fallback / manual trigger) ───────────────
  // The frontend can still send answerDone as a direct trigger 
  // (e.g., if the user clicks a "done" button). It bypasses speculation.
  socket.on("answerDone", async () => {
    if (interviewEnded) return;
    // Cancel any speculative processing
    if (speculativeAbort) {
      speculativeAbort.abort();
      speculativeAbort = null;
      isSpeculating = false;
    }
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
    const abort = new AbortController();
    currentLLMAbort = abort;
    await runLLMTurn(abort);

    isProcessing = false;
    if (!interviewEnded && !abort.signal.aborted) {
      socket.emit("readyForAnswer"); // tell frontend to start recording again
    }
  });

  // ── Force-end fallback (triggered by frontend if backend didn't end in time)
  socket.on("forceEndInterview", async () => {
    if (interviewEnded || !interviewId) return;
    interviewEnded = true;
    console.log(`[socket] Force-ending interview ${interviewId}`);

    if (speculativeAbort) speculativeAbort.abort();
    if (currentLLMAbort) currentLLMAbort.abort();
    if (speculativeCommitTimer) clearTimeout(speculativeCommitTimer);
    if (recognizeStream) {
      recognizeStream.destroy();
      recognizeStream = null;
    }

    await db.interview.update({
      where: { id: interviewId },
      data: { status: InterviewStatus.Completed },
    });

    socket.emit("interviewEnded", { reason: "force_ended", interviewId });
  });
}
