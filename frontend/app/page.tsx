"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import LandingHero from "@/components/landing/LandingHero";
import FeatureCard from "@/components/landing/FeatureCard";
import PipelineVisualization from "@/components/landing/PipelineVisualization";
import Testimonials from "@/components/landing/Testimonials";
import AnalyticsPreview from "@/components/landing/AnalyticsPreview";
import RolesMarquee from "@/components/landing/RolesMarquee";
import MagneticButton from "@/components/landing/MagneticButton";
import { getMe, logoutUser } from "@/lib/api";

const features = [
  {
    title: "Adaptive Questions",
    description:
      "Questions evolve based on your responses. Correct answers lead to deeper exploration; struggles trigger supportive follow-ups.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 10h2l2-5 3 10 2-7 2 2h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: "Real-time Voice",
    description:
      "Natural voice-based conversations with intelligent silence detection. Speak freely — the AI listens and responds naturally.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="7" y="2" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M4 10a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M10 16v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: "GitHub Analysis",
    description:
      "Your public repositories are analyzed to generate questions about technologies you actually use — not generic trivia.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2a8 8 0 00-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.22.48-2.69-1.07-2.69-1.07a2.12 2.12 0 00-.89-1.17c-.72-.5.06-.49.06-.49a1.68 1.68 0 011.23.83 1.7 1.7 0 002.33.66 1.7 1.7 0 01.51-1.07c-1.78-.2-3.64-.89-3.64-3.95a3.09 3.09 0 01.82-2.15 2.87 2.87 0 01.08-2.12s.67-.21 2.2.82a7.6 7.6 0 014 0c1.53-1.03 2.2-.82 2.2-.82a2.87 2.87 0 01.08 2.12 3.09 3.09 0 01.82 2.15c0 3.07-1.87 3.75-3.65 3.95a1.9 1.9 0 01.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0010 2z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
  },
  {
    title: "Smart Scoring",
    description:
      "Multi-dimensional evaluation across system design, data structures, communication, problem-solving, and code quality.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2l2.09 4.26L17 7.27l-3.5 3.41.83 4.82L10 13.27 5.67 15.5l.83-4.82L3 7.27l4.91-1.01L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    getMe()
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  return (
    <main
      className="iv-noise"
      style={{
        background: "var(--iv-surface-0)",
        color: "var(--iv-text-primary)",
        overflow: "hidden",
      }}
    >
      {/* ── Sticky Nav ─────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 flex items-center justify-between px-6 md:px-10 py-3 transition-all duration-300"
        style={{
          zIndex: 50,
          background: scrolled ? "rgba(15, 17, 23, 0.8)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
          borderBottom: scrolled ? "1px solid var(--iv-border-subtle)" : "1px solid transparent",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="rounded-lg flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              background: "rgba(var(--iv-accent-rgb), 0.1)",
              border: "1px solid rgba(var(--iv-accent-rgb), 0.15)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="4" width="12" height="8" rx="2" stroke="hsl(var(--iv-accent))" strokeWidth="1.2"/>
              <path d="M4 4V3a3 3 0 016 0v1" stroke="hsl(var(--iv-accent))" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--iv-text-primary)" }}>
            intervyu
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!loading && user ? (
            <>
              <span className="text-sm font-medium mr-2" style={{ color: "var(--iv-text-secondary)" }}>
                {user.name}
              </span>
              <a
                href="/dashboard"
                className="no-underline px-4 py-2 rounded-lg transition-all duration-200 hover:brightness-125"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#fff",
                  background: "rgba(var(--iv-accent-rgb), 0.15)",
                  border: "1px solid rgba(var(--iv-accent-rgb), 0.25)",
                }}
              >
                Dashboard
              </a>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white/5"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "var(--iv-text-secondary)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </>
          ) : !loading && !user ? (
            <>
              <a
                href="/login"
                className="no-underline px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white/5"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "var(--iv-text-secondary)",
                  background: "transparent",
                }}
              >
                Sign In
              </a>
              <a
                href="/signup"
                className="no-underline px-4 py-2 rounded-lg transition-all duration-200 hover:brightness-125"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#fff",
                  background: "rgba(var(--iv-accent-rgb), 0.15)",
                  border: "1px solid rgba(var(--iv-accent-rgb), 0.25)",
                }}
              >
                Sign Up
              </a>
            </>
          ) : null}
        </div>
      </nav>

      {/* ── Section 1: Hero ──────────────────────────────────────────── */}
      <div className="relative">
        <LandingHero />

        {/* Overlaid text */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <div className="iv-container text-center" style={{ maxWidth: 680 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.3 }}
            >
              <p className="iv-label mb-5">AI-Powered Technical Interviews</p>
            </motion.div>

            <motion.h1
              className="iv-heading-lg mb-5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Interviews that understand{" "}
              <span className="iv-gradient-text">your code,</span>{" "}
              not just your answers
            </motion.h1>

            <motion.p
              className="iv-body mb-8"
              style={{ maxWidth: 480, margin: "0 auto", marginBottom: 32 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Practice with an AI interviewer that analyzes your GitHub, adapts questions
              in real-time, and helps you improve through voice-based mock sessions.
            </motion.p>

            <motion.div
              className="pointer-events-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <MagneticButton href="/setup">
                Start Practicing
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </MagneticButton>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Section 2: How It Works ──────────────────────────────────── */}
      <section className="iv-section" id="how-it-works">
        <div className="iv-container">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="iv-label mb-3">How it works</p>
            <h2 className="iv-heading-md">Four steps to better interviews</h2>
          </motion.div>

          <PipelineVisualization />
        </div>
      </section>

      <div className="iv-container">
        <div className="iv-divider" />
      </div>

      {/* ── Section 3: Features ──────────────────────────────────────── */}
      <section className="iv-section" id="features">
        <div className="iv-container">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="iv-label mb-3">Features</p>
            <h2 className="iv-heading-md">Built for real interview preparation</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                title={f.title}
                description={f.description}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="iv-container">
        <div className="iv-divider" />
      </div>

      {/* ── Section 4: Analytics Preview ─────────────────────────────── */}
      <section className="iv-section" id="analytics">
        <div className="iv-container">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="iv-label mb-3">Feedback</p>
            <h2 className="iv-heading-md">Know exactly where you stand</h2>
          </motion.div>

          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <AnalyticsPreview />
          </div>
        </div>
      </section>

      <div className="iv-container">
        <div className="iv-divider" />
      </div>

      {/* ── Section 5: Why Intervyu + Roles ──────────────────────────── */}
      <section className="iv-section" id="why">
        <div className="iv-container">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="iv-label mb-3">Why Intervyu</p>
            <h2 className="iv-heading-md">Built different from day one</h2>
          </motion.div>

          <Testimonials />

          {/* Roles marquee integrated here */}
          <motion.div
            className="mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="iv-label text-center mb-6">Prepared for every engineering role</p>
            <RolesMarquee />
          </motion.div>
        </div>
      </section>

      <div className="iv-container">
        <div className="iv-divider" />
      </div>

      {/* ── Section 6: Final CTA ─────────────────────────────────────── */}
      <section className="iv-section" id="cta">
        <div className="iv-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="iv-heading-lg mb-4">
              Ready to prepare smarter?
            </h2>
            <p
              className="iv-body mb-10"
              style={{ maxWidth: 420, margin: "0 auto 40px" }}
            >
              Upload your resume, connect your GitHub, and run your first AI-powered
              mock interview in under two minutes.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <MagneticButton href="/setup">
                Start Interview
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </MagneticButton>
              <MagneticButton href="#how-it-works" variant="secondary">
                Learn More
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        className="iv-container"
        style={{
          paddingTop: 24,
          paddingBottom: 24,
          borderTop: "1px solid var(--iv-border-subtle)",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div
              className="rounded-lg flex items-center justify-center"
              style={{
                width: 28,
                height: 28,
                background: "rgba(var(--iv-accent-rgb), 0.1)",
                border: "1px solid rgba(var(--iv-accent-rgb), 0.15)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="4" width="12" height="8" rx="2" stroke="hsl(var(--iv-accent))" strokeWidth="1.2"/>
                <path d="M4 4V3a3 3 0 016 0v1" stroke="hsl(var(--iv-accent))" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--iv-text-primary)" }}>
              intervyu
            </span>
          </div>
          <p className="iv-body-sm" style={{ margin: 0, fontSize: "0.75rem" }}>
            &copy; {new Date().getFullYear()} Intervyu. Built for engineers.
          </p>
        </div>
      </footer>
    </main>
  );
}
