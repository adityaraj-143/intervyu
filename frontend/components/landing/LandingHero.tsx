"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Animated gradient mesh hero — replaces the old particle network canvas.
 * Uses CSS-animated radial gradients with floating geometric shapes for depth.
 */
export default function LandingHero() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "90vh", minHeight: 560, maxHeight: 920, background: "var(--iv-surface-0)" }}
    >
      {/* ── Animated gradient blobs ──────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {/* Primary indigo blob — top right */}
        <div
          className="absolute rounded-full"
          style={{
            width: "clamp(400px, 50vw, 700px)",
            height: "clamp(400px, 50vw, 700px)",
            top: "-10%",
            right: "-5%",
            background: "radial-gradient(circle, rgba(var(--iv-accent-rgb), 0.10) 0%, transparent 65%)",
            filter: "blur(80px)",
            animation: "iv-mesh-drift 20s ease-in-out infinite",
          }}
        />

        {/* Secondary purple blob — center left */}
        <div
          className="absolute rounded-full"
          style={{
            width: "clamp(350px, 40vw, 600px)",
            height: "clamp(350px, 40vw, 600px)",
            top: "30%",
            left: "-8%",
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 65%)",
            filter: "blur(80px)",
            animation: "iv-mesh-drift-reverse 25s ease-in-out infinite",
          }}
        />

        {/* Warm accent blob — bottom center */}
        <div
          className="absolute rounded-full"
          style={{
            width: "clamp(300px, 35vw, 500px)",
            height: "clamp(300px, 35vw, 500px)",
            bottom: "-5%",
            left: "40%",
            background: "radial-gradient(circle, rgba(var(--iv-accent-warm-rgb), 0.04) 0%, transparent 65%)",
            filter: "blur(80px)",
            animation: "iv-mesh-drift-slow 22s ease-in-out infinite",
          }}
        />

        {/* ── Floating geometric shapes ────────────────────────────────── */}
        {/* Ring 1 */}
        <div
          className="absolute"
          style={{
            width: 120,
            height: 120,
            top: "20%",
            right: "15%",
            border: "1px solid rgba(var(--iv-accent-rgb), 0.08)",
            borderRadius: "50%",
            animation: "iv-float 8s ease-in-out infinite",
          }}
        />

        {/* Ring 2 — smaller */}
        <div
          className="absolute"
          style={{
            width: 60,
            height: 60,
            top: "60%",
            left: "12%",
            border: "1px solid rgba(var(--iv-accent-rgb), 0.06)",
            borderRadius: "50%",
            animation: "iv-float 10s ease-in-out 2s infinite",
          }}
        />

        {/* Dot cluster */}
        <div
          className="absolute hidden md:block"
          style={{
            top: "35%",
            right: "25%",
            opacity: 0.3,
          }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2, 3].map((col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={10 + col * 20}
                  cy={10 + row * 20}
                  r="1.5"
                  fill="rgba(var(--iv-accent-rgb), 0.3)"
                />
              ))
            )}
          </svg>
        </div>

        {/* Diagonal line accent */}
        <div
          className="absolute hidden lg:block"
          style={{
            top: "45%",
            left: "20%",
            width: 100,
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(var(--iv-accent-rgb), 0.12), transparent)",
            transform: "rotate(-30deg)",
            animation: "iv-float 12s ease-in-out 1s infinite",
          }}
        />
      </div>

      {/* ── Bottom fade ─────────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: "linear-gradient(to top, var(--iv-surface-0), transparent)",
        }}
      />
    </section>
  );
}
