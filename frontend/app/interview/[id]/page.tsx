"use client";

import { BACKEND_URL } from "@/config";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function InterviewPage() {
  const ttsCtxRef = useRef<AudioContext | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const answerDoneRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const scheduledStopRef = useRef(0);
  // flipped to false on unmount so any in-flight getUserMedia resolves don't re-open mic
  const mountedRef = useRef(true);

  function ensureTtsCtx() {
    if (!ttsCtxRef.current || ttsCtxRef.current.state === "closed") {
      ttsCtxRef.current = new AudioContext();
    }
    if (ttsCtxRef.current.state === "suspended") {
      ttsCtxRef.current.resume();
    }
  }

  function stopMic() {
    processorRef.current?.disconnect();
    processorRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    micCtxRef.current?.close();
    micCtxRef.current = null;
  }

  function startRecording(socket: ReturnType<typeof io>) {
    stopMic();

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // If the user navigated away while waiting for mic permission, kill it immediately
        if (!mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        const micCtx = new AudioContext();
        micCtxRef.current = micCtx;
        const actualRate = micCtx.sampleRate;
        console.log("[mic] AudioContext native sampleRate:", actualRate);

        const source = micCtx.createMediaStreamSource(stream);
        const processor = micCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        socket.emit("sttConfig", { sampleRate: actualRate });

        // VAD State
        let isSpeaking = false;
        let silenceFrames = 0;
        const SILENCE_THRESHOLD = 0.01; // Adjust based on mic noise floor
        const MAX_SILENCE_FRAMES = Math.floor((2.5 * actualRate) / 4096); // ~2.5 seconds of silence

        processor.onaudioprocess = (e) => {
          if (!mountedRef.current) return; // stop sending after unmount
          const float32 = e.inputBuffer.getChannelData(0);
          
          let sumSq = 0;
          const int16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            const s = Math.max(-1, Math.min(1, float32[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            sumSq += float32[i] * float32[i];
          }
          
          const rms = Math.sqrt(sumSq / float32.length);

          // Energy-based VAD logic
          if (rms > SILENCE_THRESHOLD) {
            if (!isSpeaking) console.log("[VAD] User started speaking");
            isSpeaking = true;
            silenceFrames = 0; // Reset silence counter when user speaks
          } else if (isSpeaking) {
            silenceFrames++;
            if (silenceFrames >= MAX_SILENCE_FRAMES) {
              console.log("[VAD] User stopped speaking. Auto-triggering done.");
              isSpeaking = false;
              silenceFrames = 0;
              done(); // Automatically submit the answer!
              return; // Stop sending further chunks for this turn
            }
          }

          socket.emit("audioChunk", int16.buffer);
        };

        source.connect(processor);
        processor.connect(micCtx.destination);
        console.log("[mic] recording started — LINEAR16 @", actualRate, "Hz");
      })
      .catch((err) => console.error("[mic] getUserMedia error:", err));
  }

  useEffect(() => {
    mountedRef.current = true;

    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    ensureTtsCtx();
    startRecording(socket);

    socket.on("ttsAudio", (data: unknown) => {
      const ctx = ttsCtxRef.current;
      if (!ctx || ctx.state === "closed") return;

      let raw: ArrayBufferLike;
      if (data instanceof ArrayBuffer) {
        raw = data;
      } else if (data instanceof Uint8Array) {
        raw = data.buffer;
      } else if (data && typeof data === "object" && "buffer" in data) {
        raw = (data as { buffer: ArrayBufferLike }).buffer;
      } else {
        return;
      }

      const int16 = new Int16Array(raw);
      if (!int16.length) return;

      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = (int16[i] / 32768) * 0.5;
      }

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const duration = float32.length / 24000;
      const when = Math.max(ctx.currentTime, scheduledStopRef.current);
      scheduledStopRef.current = when + duration;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(when);
    });

    socket.on("readyForAnswer", () => {
      console.log("[interview] ready for next answer, restarting mic");
      answerDoneRef.current = false;
      startRecording(socket);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !answerDoneRef.current) {
        e.preventDefault();
        done();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      mountedRef.current = false; // prevent any pending getUserMedia from re-opening mic
      window.removeEventListener("keydown", handleKeyDown);
      stopMic(); // stops all tracks → clears browser mic indicator
      socket.disconnect();
      ttsCtxRef.current?.close();
      ttsCtxRef.current = null;
    };
  }, []);

  function done() {
    if (answerDoneRef.current) return;
    ensureTtsCtx();
    answerDoneRef.current = true;
    processorRef.current?.disconnect();
    setTimeout(() => {
      stopMic();
      socketRef.current?.emit("answerDone");
    }, 300);
  }

  return (
    <div
      style={{
        padding: "1rem",
        fontFamily: "monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "1rem",
      }}
    >
      <button
        onClick={done}
        style={{ padding: "1rem 2rem", fontSize: "1.2rem", cursor: "pointer" }}
      >
        Answer Done
      </button>
      <p style={{ color: "#666" }}>Press Space or click button when done answering</p>
    </div>
  );
}
