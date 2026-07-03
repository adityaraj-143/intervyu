"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";

interface MediaControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndInterview: () => void;
}

export default function MediaControls({
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onEndInterview,
}: MediaControlsProps) {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const baseBtnClasses =
    "flex items-center justify-center w-12 h-12 rounded-full border cursor-pointer transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] relative outline-none";

  const defaultBtnStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    color: "var(--iv-text-primary)",
  };

  const offBtnStyle = {
    background: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.25)",
    color: "#ef4444",
  };

  return (
    <>
      <motion.div
        className="flex justify-center px-6 pb-6 z-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-[22px] bg-white/4 border border-white/8 backdrop-blur-[20px]">
          {/* Mic Toggle */}
          <motion.button
            className={baseBtnClasses}
            style={isMuted ? offBtnStyle : defaultBtnStyle}
            onClick={onToggleMute}
            onMouseEnter={() => setHoveredBtn("mic")}
            onMouseLeave={() => setHoveredBtn(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            <AnimatePresence>
              {hoveredBtn === "mic" && (
                <motion.span
                  className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-black/85 border border-white/10 text-[0.6875rem] whitespace-nowrap pointer-events-none"
                  style={{ color: "var(--iv-text-primary)" }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  {isMuted ? "Unmute" : "Mute"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Camera Toggle */}
          <motion.button
            className={baseBtnClasses}
            style={isCameraOff ? offBtnStyle : defaultBtnStyle}
            onClick={onToggleCamera}
            onMouseEnter={() => setHoveredBtn("cam")}
            onMouseLeave={() => setHoveredBtn(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
          >
            {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            <AnimatePresence>
              {hoveredBtn === "cam" && (
                <motion.span
                  className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-black/85 border border-white/10 text-[0.6875rem] whitespace-nowrap pointer-events-none"
                  style={{ color: "var(--iv-text-primary)" }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  {isCameraOff ? "Turn on camera" : "Turn off camera"}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Divider */}
          <div className="w-px h-7 bg-white/8 mx-1" />

          {/* End Interview */}
          <motion.button
            className="flex items-center justify-center w-14 h-12 rounded-3xl border cursor-pointer transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] relative outline-none ml-2"
            style={{
              background: "rgba(239, 68, 68, 0.2)",
              borderColor: "rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
            }}
            onClick={() => setShowEndConfirm(true)}
            onMouseEnter={() => setHoveredBtn("end")}
            onMouseLeave={() => setHoveredBtn(null)}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 20px rgba(239, 68, 68, 0.15)",
            }}
            whileTap={{ scale: 0.9 }}
            aria-label="End interview"
          >
            <PhoneOff size={20} />
            <AnimatePresence>
              {hoveredBtn === "end" && (
                <motion.span
                  className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-black/85 border border-white/10 text-[0.6875rem] whitespace-nowrap pointer-events-none"
                  style={{ color: "var(--iv-text-primary)" }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  End Interview
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {/* End Confirmation Modal */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-[8px] flex items-center justify-center z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setShowEndConfirm(false)}
          >
            <motion.div
              className="rounded-[20px] border p-8 max-w-[400px] w-[90%] text-center"
              style={{
                background: "var(--iv-surface-3)",
                borderColor: "var(--iv-border-medium)",
              }}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--iv-text-primary)" }}>
                End Interview?
              </h3>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--iv-text-secondary)" }}>
                Are you sure you want to end this interview? Your progress has been saved.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  className="px-6 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ease-in-out border outline-none hover:bg-white/10"
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    color: "var(--iv-text-primary)",
                  }}
                  onClick={() => setShowEndConfirm(false)}
                >
                  Continue
                </button>
                <button
                  className="px-6 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 ease-in-out border outline-none hover:bg-red-500/35"
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                  }}
                  onClick={() => {
                    setShowEndConfirm(false);
                    onEndInterview();
                  }}
                >
                  End Interview
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
