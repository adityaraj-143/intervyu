"use client";

import { BACKEND_URL } from "@/config";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const answerDoneRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const scheduledStopRef = useRef(0);

  function ensureAudioCtx() {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }

  useEffect(() => {
    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    ensureAudioCtx();

    navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
      streamRef.current = s;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      console.log("[mic] using mimeType:", mimeType);
      const mediaRecorder = new MediaRecorder(s, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const buffer = await event.data.arrayBuffer();
          console.log("[mic] sending chunk:", buffer.byteLength);
          socket.emit("audioChunk", buffer);
        }
      };

      mediaRecorder.start(250);
    }).catch((err) => console.error("[mic] getUserMedia error:", err));

    socket.on("ttsAudio", (data: unknown) => {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === "closed") return;

      let raw: ArrayBufferLike;
      if (data instanceof ArrayBuffer) {
        raw = data;
      } else if (data instanceof Uint8Array) {
        raw = data.buffer;
      } else if (data && typeof data === "object" && "buffer" in data) {
        raw = (data as any).buffer;
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !answerDoneRef.current) {
        e.preventDefault();
        done();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      socket.emit("stopRecording");
      socket.disconnect();
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  function done() {
    if (answerDoneRef.current) return;
    ensureAudioCtx();
    answerDoneRef.current = true;
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    socketRef.current?.emit("answerDone");
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
        style={{
          padding: "1rem 2rem",
          fontSize: "1.2rem",
          cursor: "pointer",
        }}
      >
        Answer Done
      </button>
      <p style={{ color: "#666" }}>Press Space or click button when done answering</p>
    </div>
  );
}
