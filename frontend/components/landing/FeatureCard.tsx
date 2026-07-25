"use client";

import { motion } from "framer-motion";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

/* Each card gets a unique accent color for visual variety */
const cardAccents = [
  { bg: "rgba(99, 102, 241, 0.08)", border: "rgba(99, 102, 241, 0.12)", color: "#6366f1" },
  { bg: "rgba(168, 85, 247, 0.08)", border: "rgba(168, 85, 247, 0.12)", color: "#a855f7" },
  { bg: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" },
  { bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" },
];

export default function FeatureCard({ icon, title, description, index }: FeatureCardProps) {
  const accent = cardAccents[index % cardAccents.length];

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="iv-card iv-animated-border group"
      style={{ padding: "32px 28px" }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-xl mb-5"
        style={{
          width: 44,
          height: 44,
          background: accent.bg,
          border: `1px solid ${accent.border}`,
          color: accent.color,
          transition: "all 0.3s ease",
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3
        className="iv-heading-sm mb-3"
        style={{ fontSize: "1.0625rem" }}
      >
        {title}
      </h3>

      {/* Description */}
      <p className="iv-body-sm" style={{ margin: 0 }}>
        {description}
      </p>
    </motion.article>
  );
}
