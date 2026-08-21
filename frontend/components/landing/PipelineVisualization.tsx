"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  {
    id: "upload",
    label: "Upload",
    title: "Resume & Job Description",
    description: "Upload your resume and paste the job description for a tailored interview experience.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2v12m0-12L6 6m4-4l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 14v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "analyze",
    label: "Analyze",
    title: "AI Comprehension",
    description: "Our AI analyzes your background, GitHub projects, and the role requirements.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "interview",
    label: "Interview",
    title: "Voice Conversation",
    description: "Engage in a natural voice-based interview with adaptive follow-up questions.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="7" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 10a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 16v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "feedback",
    label: "Feedback",
    title: "Detailed Analysis",
    description: "Comprehensive feedback on technical accuracy, communication, and next steps.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 3h14v10a2 2 0 01-2 2H5a2 2 0 01-2-2V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 7h6M7 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 15l-2 3M14 15l2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

/* Each step gets a unique tint */
const stepAccents = [
  { rgb: "99, 102, 241" },
  { rgb: "168, 85, 247" },
  { rgb: "59, 130, 246" },
  { rgb: "34, 197, 94" },
];

export default function PipelineVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <div ref={containerRef} className="w-full">
      {/* Desktop: Horizontal */}
      <div className="hidden md:block">
        <div className="relative flex items-start justify-between gap-4">
          {/* Connecting line */}
          <svg
            className="absolute top-[22px] left-[44px] pointer-events-none"
            style={{ width: "calc(100% - 88px)", height: 2 }}
            aria-hidden="true"
          >
            <motion.line
              x1="0"
              y1="1"
              x2="100%"
              y2="1"
              stroke="rgba(var(--iv-accent-rgb), 0.15)"
              strokeWidth="1"
              strokeDasharray="6 4"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
            />
          </svg>

          {steps.map((step, index) => {
            const accent = stepAccents[index];
            return (
              <motion.div
                key={step.id}
                className="relative flex flex-col items-center text-center group"
                style={{ flex: 1, maxWidth: 240 }}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
              >
                {/* Node circle */}
                <motion.div
                  className="relative z-10 flex items-center justify-center rounded-full mb-4 transition-all duration-300"
                  style={{
                    width: 44,
                    height: 44,
                    background: `rgba(${accent.rgb}, 0.08)`,
                    border: `1px solid rgba(${accent.rgb}, 0.15)`,
                    color: `rgb(${accent.rgb})`,
                  }}
                  whileHover={{
                    scale: 1.12,
                    boxShadow: `0 0 24px rgba(${accent.rgb}, 0.2)`,
                  }}
                >
                  {step.icon}
                </motion.div>

                {/* Label */}
                <span
                  className="iv-label mb-2 transition-colors duration-300"
                  style={{ color: `rgb(${accent.rgb})` }}
                >
                  {step.label}
                </span>

                {/* Title */}
                <h4 className="iv-heading-sm mb-2" style={{ fontSize: "0.9375rem" }}>
                  {step.title}
                </h4>

                {/* Description — always visible */}
                <p className="iv-body-sm" style={{ margin: 0, maxWidth: 200 }}>
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile: Vertical */}
      <div className="md:hidden space-y-5">
        {steps.map((step, index) => {
          const accent = stepAccents[index];
          return (
            <motion.div
              key={step.id}
              className="flex gap-4 items-start"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.12 }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full"
                style={{
                  width: 40,
                  height: 40,
                  background: `rgba(${accent.rgb}, 0.08)`,
                  border: `1px solid rgba(${accent.rgb}, 0.15)`,
                  color: `rgb(${accent.rgb})`,
                }}
              >
                {step.icon}
              </div>
              <div>
                <span className="iv-label block mb-1" style={{ color: `rgb(${accent.rgb})` }}>
                  {step.label}
                </span>
                <h4 className="iv-heading-sm mb-1" style={{ fontSize: "0.9375rem" }}>
                  {step.title}
                </h4>
                <p className="iv-body-sm" style={{ margin: 0 }}>
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
