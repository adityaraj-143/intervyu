"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "The adaptive follow-up questions caught me off guard — in a good way. It felt like talking to a senior engineer, not a chatbot.",
    name: "Priya Sharma",
    role: "Frontend Engineer",
    initials: "PS",
  },
  {
    quote:
      "I used this to prep for my Google interview. The GitHub analysis meant questions were actually about my real projects. Game changer.",
    name: "Marcus Chen",
    role: "Full-Stack Developer",
    initials: "MC",
  },
  {
    quote:
      "The voice interface makes it feel real. I've done mock interviews with friends before, but the consistency and depth here is unmatched.",
    name: "Sarah Okonkwo",
    role: "Backend Engineer",
    initials: "SO",
  },
];

export default function Testimonials() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {testimonials.map((t, i) => (
        <motion.blockquote
          key={i}
          className="iv-card-glass group"
          style={{ padding: "32px 28px", margin: 0 }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{
            duration: 0.6,
            delay: i * 0.12,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          whileHover={{ rotateY: 2, rotateX: -1 }}
        >
          <p
            className="iv-body mb-6"
            style={{ fontStyle: "italic", lineHeight: 1.7 }}
          >
            &ldquo;{t.quote}&rdquo;
          </p>
          <footer className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: 36,
                height: 36,
                background: "rgba(82, 102, 255, 0.1)",
                border: "1px solid rgba(82, 102, 255, 0.15)",
                color: "hsl(var(--iv-accent))",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              {t.initials}
            </div>
            <div>
              <cite
                className="not-italic block"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "var(--iv-text-primary)",
                }}
              >
                {t.name}
              </cite>
              <span className="iv-body-sm" style={{ fontSize: "0.75rem" }}>
                {t.role}
              </span>
            </div>
          </footer>
        </motion.blockquote>
      ))}
    </div>
  );
}
