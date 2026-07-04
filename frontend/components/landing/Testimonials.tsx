"use client";

import { motion } from "framer-motion";

const valueProps = [
  {
    title: "No scheduling needed",
    description:
      "Practice anytime, skip the awkward ask. No need to find a friend, mentor, or pay for a human mock interviewer. Just open the app and start.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: "Questions from your actual code",
    description:
      "We analyze your public GitHub repositories and resume to craft questions about technologies you actually use — not generic trivia.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7 7l-4 3 4 3M13 7l4 3-4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11 5l-2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: "Feels like a real interview",
    description:
      "Voice-based conversation with natural pauses, adaptive follow-ups, and an AI that listens and responds like a senior engineer would.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="7" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 10a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 16v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function Testimonials() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {valueProps.map((v, i) => (
        <motion.div
          key={v.title}
          className="iv-card iv-animated-border group"
          style={{ padding: "32px 28px" }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            duration: 0.6,
            delay: i * 0.12,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {/* Icon */}
          <div
            className="flex items-center justify-center rounded-xl mb-5"
            style={{
              width: 44,
              height: 44,
              background: "rgba(82, 102, 255, 0.08)",
              border: "1px solid rgba(82, 102, 255, 0.12)",
              color: "hsl(var(--iv-accent))",
              transition: "all 0.3s ease",
            }}
          >
            {v.icon}
          </div>

          {/* Title */}
          <h3
            className="iv-heading-sm mb-3"
            style={{ fontSize: "1.0625rem" }}
          >
            {v.title}
          </h3>

          {/* Description */}
          <p className="iv-body-sm" style={{ margin: 0, lineHeight: 1.7 }}>
            {v.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
