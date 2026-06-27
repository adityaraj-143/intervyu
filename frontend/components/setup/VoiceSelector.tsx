"use client";

import { motion } from "framer-motion";

interface VoiceSelectorProps {
  selected: string;
  onSelect: (voice: string) => void;
}

const voices = [
  {
    id: "professional",
    name: "Professional",
    description: "Clear, measured tone",
    waveform: [3, 6, 4, 8, 5, 7, 3, 6, 4, 5, 7, 3],
  },
  {
    id: "conversational",
    name: "Conversational",
    description: "Warm, natural delivery",
    waveform: [2, 5, 8, 4, 6, 3, 7, 5, 4, 6, 3, 5],
  },
  {
    id: "technical",
    name: "Technical",
    description: "Precise, analytical style",
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
  return (
    <div className="grid grid-cols-3 gap-3">
      {voices.map((voice) => {
        const isActive = selected === voice.id;
        return (
          <motion.button
            key={voice.id}
            onClick={() => onSelect(voice.id)}
            className="relative text-left"
            style={{
              padding: "16px 14px",
              borderRadius: 14,
              background: isActive ? "rgba(82, 102, 255, 0.06)" : "var(--iv-surface-2)",
              border: `1px solid ${
                isActive ? "rgba(82, 102, 255, 0.3)" : "var(--iv-border-subtle)"
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
                  boxShadow: "0 0 8px rgba(82, 102, 255, 0.4)",
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
