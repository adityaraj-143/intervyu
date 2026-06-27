"use client";

import { motion } from "framer-motion";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

export default function FeatureCard({ icon, title, description, index }: FeatureCardProps) {
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
      style={{ padding: "36px 32px" }}
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
