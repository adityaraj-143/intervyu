"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const skills = [
  { name: "System Design", value: 85 },
  { name: "Data Structures", value: 78 },
  { name: "Communication", value: 92 },
  { name: "Problem Solving", value: 88 },
  { name: "Code Quality", value: 74 },
];

const overallScore = 83;

export default function AnalyticsPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const circumference = 2 * Math.PI * 42;
  const target = circumference - (overallScore / 100) * circumference;

  return (
    <motion.div
      ref={ref}
      className="iv-card-glass overflow-hidden"
      style={{ padding: 0 }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-5"
        style={{ borderBottom: "1px solid var(--iv-border-subtle)" }}
      >
        <div>
          <p className="iv-label mb-1">Interview Analytics</p>
          <h3 className="iv-heading-sm" style={{ fontSize: "1rem" }}>
            Performance Breakdown
          </h3>
        </div>
        <div
          className="px-3 py-1 rounded-full"
          style={{
            background: "rgba(82, 102, 255, 0.08)",
            border: "1px solid rgba(82, 102, 255, 0.15)",
            color: "hsl(var(--iv-accent))",
            fontSize: "0.75rem",
            fontWeight: 500,
          }}
        >
          Preview
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
        {/* Skill Bars */}
        <div className="space-y-4">
          {skills.map((skill, i) => (
            <div key={skill.name}>
              <div className="flex justify-between mb-1.5">
                <span className="iv-body-sm" style={{ color: "var(--iv-text-primary)", fontSize: "0.8125rem" }}>
                  {skill.name}
                </span>
                <span className="iv-body-sm" style={{ fontSize: "0.75rem" }}>
                  {skill.value}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--iv-surface-3)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, hsl(230, 100%, 66%), hsl(250, 100%, 72%))`,
                    transformOrigin: "left",
                  }}
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: skill.value / 100 } : { scaleX: 0 }}
                  transition={{
                    duration: 1,
                    delay: 0.3 + i * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Circular Score */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative" style={{ width: 120, height: 120 }}>
            <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
              {/* Track */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--iv-surface-3)"
                strokeWidth="5"
              />
              {/* Progress */}
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={isInView ? { strokeDashoffset: target } : { strokeDashoffset: circumference }}
                transition={{
                  duration: 1.5,
                  delay: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(230, 100%, 66%)" />
                  <stop offset="100%" stopColor="hsl(270, 100%, 72%)" />
                </linearGradient>
              </defs>
            </svg>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <motion.span
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--iv-text-primary)",
                  lineHeight: 1,
                }}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                {overallScore}
              </motion.span>
              <span className="iv-body-sm" style={{ fontSize: "0.6875rem", marginTop: 2 }}>
                Overall Score
              </span>
            </div>
          </div>
          <p className="iv-body-sm mt-4 text-center" style={{ maxWidth: 180 }}>
            Comprehensive evaluation across technical and soft skills
          </p>
        </div>
      </div>
    </motion.div>
  );
}
