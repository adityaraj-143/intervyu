"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { User } from "lucide-react";

interface UserVideoBoxProps {
  stream: MediaStream | null;
  isCameraOff: boolean;
  isMuted: boolean;
}

// Extend Window for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
}

export default function UserVideoBox({ stream, isCameraOff, isMuted }: UserVideoBoxProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [subtitle, setSubtitle] = useState("");
  const subtitleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMutedRef = useRef(isMuted);

  // Keep muted ref in sync
  useEffect(() => {
    isMutedRef.current = isMuted;
    if (isMuted) {
      setSubtitle("");
    }
  }, [isMuted]);

  // Attach stream to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && !isCameraOff) {
      video.srcObject = stream;
      video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [stream, isCameraOff]);

  // Web Speech API for subtitles
  const startRecognition = useCallback(() => {
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => SpeechRecognitionInstance) | undefined
      || (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => SpeechRecognitionInstance) | undefined;

    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (isMutedRef.current) return;

      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          setSubtitle(result[0].transcript);
          if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
          subtitleTimeoutRef.current = setTimeout(() => setSubtitle(""), 3000);
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      if (interimTranscript) {
        setSubtitle(interimTranscript);
        if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
        subtitleTimeoutRef.current = setTimeout(() => setSubtitle(""), 4000);
      }
    };

    recognition.onend = () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = setTimeout(() => {
        if (!isMutedRef.current) {
          startRecognition();
        }
      }, 300);
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("[SpeechRecognition] error:", event.error);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      // May throw if already started
    }
  }, []);

  useEffect(() => {
    startRecognition();

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
      if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    };
  }, [startRecognition]);

  // Handle mute/unmute for recognition
  useEffect(() => {
    if (isMuted) {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
        recognitionRef.current = null;
      }
    } else {
      startRecognition();
    }
  }, [isMuted, startRecognition]);

  return (
    <div
      className="relative rounded-[20px] overflow-hidden border transition-[border-color] duration-400 ease-in-out flex-[0.8] flex items-center justify-center max-md:flex-1 hover:border-[var(--iv-border-medium)]"
      style={{
        background: "var(--iv-surface-2)",
        borderColor: "var(--iv-border-subtle)",
      }}
    >
      {/* Label */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-black/50 backdrop-blur-[12px] border border-white/8 z-5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            !isMuted
              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
              : ""
          }`}
          style={isMuted ? { background: "var(--iv-text-tertiary)" } : undefined}
        />
        <span className="text-xs font-medium tracking-[0.02em]" style={{ color: "var(--iv-text-primary)" }}>
          You
        </span>
      </div>

      {/* Video / Camera Off */}
      {!isCameraOff && stream ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover -scale-x-100"
          autoPlay
          playsInline
          muted
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full" style={{ background: "var(--iv-surface-2)" }}>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(var(--iv-accent-rgb), 0.2), rgba(var(--iv-accent-rgb), 0.05))",
              border: "2px solid rgba(var(--iv-accent-rgb), 0.15)",
            }}
          >
            <User size={36} style={{ color: "rgba(var(--iv-accent-rgb), 0.6)" }} />
          </div>
          <span className="mt-3 text-[0.8125rem]" style={{ color: "var(--iv-text-tertiary)" }}>
            Camera is off
          </span>
        </div>
      )}

      {/* Subtitles */}
      {subtitle && !isMuted && (
        <div className="absolute bottom-5 left-4 right-4 flex justify-center z-5 pointer-events-none">
          <div
            className="max-w-[90%] px-4 py-2 rounded-[10px] bg-black/70 backdrop-blur-[8px] border border-white/6 text-sm leading-relaxed text-center iv-subtitle-enter"
            style={{ color: "var(--iv-text-primary)" }}
            key={subtitle.slice(0, 20)}
          >
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
}
