"use client";

import { useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

export default function MagneticButton({
  children,
  onClick,
  href,
  className = "",
  variant = "primary",
  disabled = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current || disabled) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      x.set(distX * 0.15);
      y.set(distY * 0.15);
    },
    [x, y, disabled]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }, [x, y]);

  const handleMouseEnter = useCallback(() => {
    if (!disabled) setIsHovered(true);
  }, [disabled]);

  const baseStyles =
    variant === "primary"
      ? {
          background: `linear-gradient(135deg, hsl(239, 84%, 67%) 0%, hsl(250, 75%, 60%) 100%)`,
          color: "#fff",
          border: "none",
        }
      : {
          background: "transparent",
          color: "var(--iv-text-primary)",
          border: "1px solid var(--iv-border-medium)",
        };

  const content = (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY, ...baseStyles }}
      className={`
        relative inline-flex items-center justify-center gap-2
        px-7 py-3 rounded-xl font-medium text-sm
        cursor-pointer select-none
        transition-shadow duration-300
        ${isHovered && variant === "primary" ? "iv-accent-glow-strong" : ""}
        ${isHovered && variant === "secondary" ? "iv-glass-hover" : ""}
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
        ${className}
      `}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={disabled ? undefined : onClick}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      role="button"
      tabIndex={0}
      aria-disabled={disabled}
    >
      {/* Shimmer effect on hover */}
      {isHovered && variant === "primary" && (
        <motion.div
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
              animation: "iv-shimmer 1.5s ease-in-out infinite",
            }}
          />
        </motion.div>
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="inline-block no-underline">
        {content}
      </a>
    );
  }

  return content;
}
