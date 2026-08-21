"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

interface VoiceSelectorProps {
  selected: string;
  onSelect: (voice: string) => void;
}

const voices = [
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George",
    description: "Warm, captivating storyteller",
    src: "/george.mp3",
    waveform: [3, 6, 4, 8, 5, 7, 3, 6, 4, 5, 7, 3],
  },
  {
    id: "fATgBRI8wg5KkDFg8vBd",
    name: "James",
    description: "British, professional, smooth",
    src: "/james.mp3",
    waveform: [2, 5, 8, 4, 6, 3, 7, 5, 4, 6, 3, 5],
  },
  {
    id: "XrExE9yKIg1WjnnlVkGX",
    name: "Matilda",
    description: "Knowledgable, professional",
    src: "/matilda.mp3",
    waveform: [4, 7, 3, 6, 8, 4, 5, 7, 3, 4, 6, 5],
  },
];

function MiniWaveform({ bars, active }: { bars: number[]; active: boolean }) {
  return (
    <div className="flex items-center gap-[2px]" style={{ height: 20 }}>
      {bars.map((h, i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{
            width: 2,
            background: active ? "hsl(var(--iv-accent))" : "var(--iv-text-tertiary)",
            transition: "background 0.3s ease",
          }}
          animate={
            active
              ? {
                  height: [h, h * 1.4, h],
                  opacity: [0.6, 1, 0.6],
                }
              : { height: h, opacity: 0.4 }
          }
          transition={
            active
              ? {
                  duration: 0.8 + i * 0.05,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

export default function VoiceSelector({ selected, onSelect }: VoiceSelectorProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playPreview = (src: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.play().catch(err => console.error("Error playing audio preview", err));
  };

  return (
    <div className="grid grid-cols-3 gap-3">
      {voices.map((voice) => {
        const isActive = selected === voice.id;
        return (
          <motion.button
            key={voice.id}
            onClick={() => {
              onSelect(voice.id);
              playPreview(voice.src);
            }}
            className="relative text-left"
            style={{
              padding: "16px 14px",
              borderRadius: 14,
              background: isActive ? "rgba(var(--iv-accent-rgb), 0.06)" : "var(--iv-surface-2)",
              border: `1px solid ${
                isActive ? "rgba(var(--iv-accent-rgb), 0.3)" : "var(--iv-border-subtle)"
              }`,
              cursor: "pointer",
              transition: "all 0.3s ease",
              outline: "none",
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-pressed={isActive}
            role="radio"
          >
            {/* Waveform */}
            <div className="mb-3">
              <MiniWaveform bars={voice.waveform} active={isActive} />
            </div>

            {/* Name */}
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 500,
                color: isActive ? "var(--iv-text-primary)" : "var(--iv-text-secondary)",
                marginBottom: 2,
                transition: "color 0.3s ease",
              }}
            >
              {voice.name}
            </p>

            {/* Description */}
            <p className="iv-body-sm" style={{ margin: 0, fontSize: "0.6875rem" }}>
              {voice.description}
            </p>

            {/* Active indicator */}
            {isActive && (
              <motion.div
                layoutId="voiceIndicator"
                className="absolute top-3 right-3 rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  background: "hsl(var(--iv-accent))",
                  boxShadow: "0 0 8px rgba(var(--iv-accent-rgb), 0.4)",
                }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
