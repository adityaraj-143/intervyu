"use client";

import { BACKEND_URL } from "@/config";
import { use, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import AIVideoBox from "@/components/interview/AIVideoBox";
import UserVideoBox from "@/components/interview/UserVideoBox";
import MediaControls from "@/components/interview/MediaControls";

// ── Timer thresholds (seconds) ──────────────────────────────────────
const WARN_SECONDS = 20;   // 20 seconds — amber warning
const DANGER_SECONDS = 40; // 40 seconds — red danger
const FALLBACK_SECONDS = 45; // 45 seconds — frontend force-end

// Set to true to preview the UI without connecting to the backend or using AI credits.
// Flip back to false when ready to run real interviews.
const DEMO_MODE = false;

export default function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: interviewId } = use(params);

  // Refs for audio/socket infrastructure
  const ttsCtxRef = useRef<AudioContext | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const answerDoneRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const vadIntervalRef = useRef<number | null>(null);
  const scheduledStopRef = useRef(0);
  const mountedRef = useRef(true);
  const isMutedRef = useRef(false);

  // UI State
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [elapsed, setElapsed] = useState(0);

  // Keep mute ref in sync for use in callbacks
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Derive timer visual state
  const timerState = useMemo(() => {
    if (elapsed >= DANGER_SECONDS) return "danger" as const;
    if (elapsed >= WARN_SECONDS) return "warn" as const;
    return "normal" as const;
  }, [elapsed]);

  const timerDotColor = timerState === "danger"
    ? "#ef4444"
    : timerState === "warn"
      ? "#f59e0b"
      : "#ef4444"; // default red recording dot

  const timerTextColor = timerState === "danger"
    ? "#ef4444"
    : timerState === "warn"
      ? "#f59e0b"
      : "var(--iv-text-secondary)";

  // ── Audio helpers ──────────────────────────────────────────────────

  function ensureTtsCtx() {
    if (!ttsCtxRef.current || ttsCtxRef.current.state === "closed") {
      ttsCtxRef.current = new AudioContext();
    }
    if (ttsCtxRef.current.state === "suspended") {
      ttsCtxRef.current.resume();
    }
  }

  function stopMic() {
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
      vadIntervalRef.current = null;
    }
    processorRef.current?.disconnect();
    processorRef.current = null;
    micCtxRef.current?.close();
    micCtxRef.current = null;
  }

  const done = useCallback(() => {
    if (answerDoneRef.current) return;
    ensureTtsCtx();
    answerDoneRef.current = true;
    setIsThinking(true);
    processorRef.current?.disconnect();
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
    }
    setTimeout(() => {
      stopMic();
      socketRef.current?.emit("answerDone");
    }, 300);
  }, []);

  function startRecording(socket: ReturnType<typeof io>) {
    stopMic();

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
        },
      })
      .then((audioStream) => {
        if (!mountedRef.current) {
          audioStream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Store the audio stream ref for cleanup
        audioStreamRef.current = audioStream;

        const micCtx = new window.AudioContext({ sampleRate: 16000 });
        micCtxRef.current = micCtx;

        const source = micCtx.createMediaStreamSource(audioStream);

        // VAD Analyser
        const analyser = micCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        let isSpeaking = false;
        let silenceFrames = 0;
        const SILENCE_THRESHOLD = 5;
        const MAX_SILENCE_FRAMES = 25; // ~2.5s

        const vadInterval = window.setInterval(() => {
          if (!mountedRef.current) {
            clearInterval(vadInterval);
            return;
          }
          if (isMutedRef.current) return;

          analyser.getByteTimeDomainData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += Math.abs(dataArray[i] - 128);
          }
          const avg = sum / bufferLength;

          if (avg > SILENCE_THRESHOLD) {
            if (!isSpeaking) console.log("[VAD] User started speaking");
            isSpeaking = true;
            silenceFrames = 0;
          } else if (isSpeaking) {
            silenceFrames++;
            if (silenceFrames >= MAX_SILENCE_FRAMES) {
              console.log("[VAD] User stopped speaking. Auto-triggering done.");
              isSpeaking = false;
              silenceFrames = 0;
              done();
              return;
            }
          }
        }, 100);
        vadIntervalRef.current = vadInterval;

        const processor = micCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (!mountedRef.current || answerDoneRef.current) return;
          if (isMutedRef.current) return;

          const float32 = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            const s = Math.max(-1, Math.min(1, float32[i]));
            int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          socket.emit("audioChunk", int16.buffer);
        };

        source.connect(processor);
        processor.connect(micCtx.destination); // Required for onaudioprocess to fire

        socket.emit("sttConfig", { sampleRate: 16000 });
        console.log("[mic] recording started — LINEAR16 @ 16000 Hz");
      })
      .catch((err) => console.error("[mic] getUserMedia error:", err));
  }

  // ── Initialize video + socket ──────────────────────────────────────

  useEffect(() => {
    if (DEMO_MODE) return; // Skip all socket/audio setup in demo mode
    mountedRef.current = true;

    // Get video stream (separate from audio — video stays alive the whole session)
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((videoStream) => {
        if (!mountedRef.current) {
          videoStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = videoStream;
        setMediaStream(videoStream);
      })
      .catch((err) => {
        console.warn("[video] getUserMedia error:", err);
        // Continue without video — interview still works
      });

    const socket = io(BACKEND_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinInterview", { interviewId });
    });

    ensureTtsCtx();
    startRecording(socket);

    let activeSources = 0;

    socket.on("ttsAudio", (data: unknown) => {
      setIsThinking(false);

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

      activeSources++;
      setIsTTSPlaying(true);

      source.onended = () => {
        activeSources--;
        if (activeSources <= 0) {
          activeSources = 0;
        }
      };
    });

    socket.on("readyForAnswer", () => {
      console.log("[interview] ready for next answer, restarting mic");
      answerDoneRef.current = false;
      setIsThinking(false);
      setIsTTSPlaying(false);
      startRecording(socket);
    });

    // Listen for backend-driven interview end (time expired)
    socket.on("interviewEnded", ({ reason }: { reason: string }) => {
      console.log(`[interview] Interview ended by backend: ${reason}`);
      mountedRef.current = false;
      stopMic();
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      socket.disconnect();
      ttsCtxRef.current?.close();
      ttsCtxRef.current = null;
      window.location.href = "/";
    });

    return () => {
      mountedRef.current = false;
      stopMic();
      // Stop audio stream
      audioStreamRef.current?.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
      // Stop video stream
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      socket.disconnect();
      ttsCtxRef.current?.close();
      ttsCtxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Frontend fallback: force-end if backend hasn't ended by 11 min ──
  useEffect(() => {
    if (DEMO_MODE) return;
    if (elapsed >= FALLBACK_SECONDS && mountedRef.current) {
      console.log("[interview] Frontend fallback: forcing end at 11 min");
      socketRef.current?.emit("forceEndInterview");
      // The interviewEnded listener will handle cleanup & redirect
    }
  }, [elapsed]);

  // ── Camera toggle ──────────────────────────────────────────────────

  const handleToggleCamera = useCallback(() => {
    setIsCameraOff((prev) => {
      const next = !prev;
      const videoTrack = streamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !next;
      }
      return next;
    });
  }, []);

  // ── Mute toggle ────────────────────────────────────────────────────

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      // Toggle the actual hardware audio track so the OS stops capturing
      const audioTrack = audioStreamRef.current?.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !next;
      }
      return next;
    });
  }, []);

  // ── End interview ──────────────────────────────────────────────────

  const handleEndInterview = useCallback(() => {
    mountedRef.current = false;
    stopMic();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    socketRef.current?.disconnect();
    ttsCtxRef.current?.close();
    ttsCtxRef.current = null;
    window.location.href = "/";
  }, []);

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden font-sans" style={{ background: "var(--iv-surface-1)" }}>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between px-6 py-4 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="w-2 h-2 rounded-full animate-[iv-glow-pulse_2s_ease-in-out_infinite]"
            style={{
              background: "hsl(var(--iv-accent))",
              boxShadow: "0 0 12px rgba(var(--iv-accent-rgb), 0.5)",
            }}
          />
          <span className="text-sm font-medium tracking-wide" style={{ color: "var(--iv-text-secondary)" }}>
            intervyu
          </span>
        </div>
        <div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-[20px] border transition-all duration-500"
          style={{
            borderColor: timerState === "danger"
              ? "rgba(239, 68, 68, 0.3)"
              : timerState === "warn"
                ? "rgba(245, 158, 11, 0.25)"
                : "rgba(255, 255, 255, 0.06)",
            background: timerState === "danger"
              ? "rgba(239, 68, 68, 0.1)"
              : timerState === "warn"
                ? "rgba(245, 158, 11, 0.08)"
                : "rgba(255, 255, 255, 0.04)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-[iv-glow-pulse_1.5s_ease-in-out_infinite] transition-colors duration-500"
            style={{ backgroundColor: timerDotColor }}
          />
          <span
            className="text-[0.8125rem] font-medium tracking-wider tabular-nums transition-colors duration-500"
            style={{ color: timerTextColor }}
          >
            {formatTime(elapsed)}
          </span>
        </div>
      </motion.div>

      {/* Video Grid */}
      <motion.div
        className="flex-1 flex gap-4 px-6 pb-4 min-h-0 max-md:flex-col max-md:px-3 max-md:pb-3 max-md:gap-3"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
      >
        <AIVideoBox isSpeaking={isTTSPlaying} isThinking={isThinking} />
        <UserVideoBox
          stream={mediaStream}
          isCameraOff={isCameraOff}
          isMuted={isMuted}
          key="user-video"
        />
      </motion.div>

      {/* Controls */}
      <MediaControls
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        onToggleMute={handleToggleMute}
        onToggleCamera={handleToggleCamera}
        onEndInterview={handleEndInterview}
      />
    </div>
  );
}
