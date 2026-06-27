"use client";

import { useRef, useEffect, useState } from "react";
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
    description: "Our AI analyzes your background, GitHub projects, and the role requirements to craft relevant questions.",
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
    description: "Receive comprehensive feedback on technical accuracy, communication, and areas for improvement.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 3h14v10a2 2 0 01-2 2H5a2 2 0 01-2-2V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M7 7h6M7 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 15l-2 3M14 15l2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function PipelineVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [activeStep, setActiveStep] = useState<string | null>(null);

  return (
    <div ref={containerRef} className="w-full">
      {/* Desktop: Horizontal */}
      <div className="hidden md:block">
        <div className="relative flex items-start justify-between">
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
              stroke="rgba(82, 102, 255, 0.2)"
              strokeWidth="1"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
            />
          </svg>

          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              className="relative flex flex-col items-center text-center"
              style={{ flex: 1, maxWidth: 220 }}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
              onMouseEnter={() => setActiveStep(step.id)}
              onMouseLeave={() => setActiveStep(null)}
            >
              {/* Node circle */}
              <motion.div
                className="relative z-10 flex items-center justify-center rounded-full mb-4"
                style={{
                  width: 44,
                  height: 44,
                  background:
                    activeStep === step.id
                      ? "rgba(82, 102, 255, 0.15)"
                      : "var(--iv-surface-2)",
                  border: `1px solid ${
                    activeStep === step.id
                      ? "rgba(82, 102, 255, 0.4)"
                      : "var(--iv-border-subtle)"
                  }`,
                  color:
                    activeStep === step.id
                      ? "hsl(var(--iv-accent))"
                      : "var(--iv-text-secondary)",
                  transition: "all 0.3s ease",
                }}
                whileHover={{ scale: 1.1 }}
              >
                {step.icon}
              </motion.div>

              {/* Label */}
              <span
                className="iv-label mb-2"
                style={{
                  color:
                    activeStep === step.id
                      ? "hsl(var(--iv-accent))"
                      : "var(--iv-text-tertiary)",
                  transition: "color 0.3s ease",
                }}
              >
                {step.label}
              </span>

              {/* Title */}
              <h4 className="iv-heading-sm mb-2" style={{ fontSize: "0.9375rem" }}>
                {step.title}
              </h4>

              {/* Description — revealed on hover */}
              <motion.p
                className="iv-body-sm"
                style={{ margin: 0, maxWidth: 180 }}
                initial={{ opacity: 0, height: 0 }}
                animate={
                  activeStep === step.id
                    ? { opacity: 1, height: "auto" }
                    : { opacity: 0, height: 0 }
                }
                transition={{ duration: 0.25 }}
              >
                {step.description}
              </motion.p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical */}
      <div className="md:hidden space-y-6">
        {steps.map((step, index) => (
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
                background: "rgba(82, 102, 255, 0.08)",
                border: "1px solid rgba(82, 102, 255, 0.15)",
                color: "hsl(var(--iv-accent))",
              }}
            >
              {step.icon}
            </div>
            <div>
              <span className="iv-label block mb-1">{step.label}</span>
              <h4 className="iv-heading-sm mb-1" style={{ fontSize: "0.9375rem" }}>
                {step.title}
              </h4>
              <p className="iv-body-sm" style={{ margin: 0 }}>
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
