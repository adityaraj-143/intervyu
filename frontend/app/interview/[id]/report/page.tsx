"use client";

import { BACKEND_URL } from "@/config";
import { use, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

// ── Types ────────────────────────────────────────────────────────────

interface CategoryScore {
  name: string;
  score: number;
  feedback: string;
}

interface InterviewReport {
  overallScore: number;
  summary: string;
  categories: CategoryScore[];
  strengths: string[];
  weaknesses: string[];
  actionItems: string[];
}

interface TranscriptMessage {
  role: "Interviewer" | "Interviewee";
  content: string;
  createdAt: string;
}

// ── Loading messages ─────────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Analyzing your responses…",
  "Evaluating technical depth…",
  "Reviewing communication patterns…",
  "Scoring your performance…",
  "Generating personalized feedback…",
  "Identifying strengths & areas to improve…",
  "Preparing your action items…",
  "Almost there…",
];

// ── Helpers ──────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return "hsl(142, 71%, 45%)";
  if (score >= 60) return "hsl(48, 96%, 53%)";
  if (score >= 40) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
}

function getScoreGrade(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  if (score >= 60) return "Average";
  if (score >= 50) return "Below Average";
  return "Needs Work";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Circular Progress Component ──────────────────────────────────────

function CircularProgress({ score, size = 180 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 204, 0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold tabular-nums"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {score}
        </motion.span>
        <span className="text-xs mt-1" style={{ color: "var(--iv-text-tertiary)" }}>
          out of 100
        </span>
      </div>
    </div>
  );
}

// ── Category Bar Component ───────────────────────────────────────────

function CategoryBar({ category, index }: { category: CategoryScore; index: number }) {
  const color = getScoreColor(category.score);

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--iv-text-primary)" }}>
          {category.name}
        </span>
        <span className="text-sm font-semibold tabular-nums" style={{ color }}>
          {category.score}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "rgba(148, 163, 204, 0.08)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${category.score}%` }}
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.6 + index * 0.1 }}
        />
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "var(--iv-text-secondary)" }}>
        {category.feedback}
      </p>
    </motion.div>
  );
}

// ── Glass Card Component ─────────────────────────────────────────────

function GlassCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: "var(--iv-glass-bg)",
        border: "1px solid var(--iv-glass-border)",
        backdropFilter: "blur(12px)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── Loading Screen Component ─────────────────────────────────────────

function LoadingScreen() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-8"
      style={{ background: "var(--iv-surface-0)" }}
    >
      {/* Pulsing orb */}
      <div className="relative">
        <motion.div
          className="w-24 h-24 rounded-full"
          style={{
            background: "radial-gradient(circle, hsla(230, 100%, 66%, 0.3) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="w-12 h-12 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: "hsl(230, 100%, 66%)",
              borderRightColor: "hsl(230, 100%, 66%, 0.3)",
            }}
          />
        </motion.div>
      </div>

      {/* Logo */}
      <motion.span
        className="text-lg font-semibold tracking-wide"
        style={{ color: "var(--iv-text-primary)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        intervyu
      </motion.span>

      {/* Rotating messages */}
      <div className="h-6 relative">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIdx}
            className="text-sm absolute w-80 text-center"
            style={{ color: "var(--iv-text-secondary)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {LOADING_MESSAGES[msgIdx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Error Screen Component ───────────────────────────────────────────

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6"
      style={{ background: "var(--iv-surface-0)" }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: "rgba(239, 68, 68, 0.1)" }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="hsl(0, 84%, 60%)" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <p className="text-sm" style={{ color: "var(--iv-text-secondary)" }}>{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 cursor-pointer"
        style={{
          background: "hsl(230, 100%, 66%)",
          color: "#fff",
        }}
      >
        Try Again
      </button>
    </div>
  );
}

// ── Main Report Page ─────────────────────────────────────────────────

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: interviewId } = use(params);

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [interviewMeta, setInterviewMeta] = useState<{
    interviewType?: string;
    createdAt?: string;
    hasResume?: boolean;
    hasJd?: boolean;
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Trigger report generation (idempotent)
      const genRes = await axios.post(
        `${BACKEND_URL}/api/v1/interview/${interviewId}/report`,
        {},
        { withCredentials: true }
      );

      if (genRes.data.report) {
        setReport(genRes.data.report);
      }

      // Fetch report metadata
      const metaRes = await axios.get(
        `${BACKEND_URL}/api/v1/interview/${interviewId}/report`,
        { withCredentials: true }
      );

      if (metaRes.data.report) {
        setReport(metaRes.data.report);
        setInterviewMeta({
          interviewType: metaRes.data.interviewType,
          createdAt: metaRes.data.createdAt,
          hasResume: metaRes.data.hasResume,
          hasJd: metaRes.data.hasJd,
        });
      }

      // Fetch transcript
      const transRes = await axios.get(
        `${BACKEND_URL}/api/v1/interview/${interviewId}/transcript`,
        { withCredentials: true }
      );

      if (transRes.data.messages) {
        setTranscript(transRes.data.messages);
      }
    } catch (err: any) {
      console.error("[Report] Error:", err);
      setError(err?.response?.data?.error || "Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // ── Render states ──────────────────────────────────────────────────

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onRetry={fetchReport} />;
  if (!report) return <ErrorScreen message="No report data available" onRetry={fetchReport} />;

  const scoreColor = getScoreColor(report.overallScore);
  const grade = getScoreGrade(report.overallScore);

  return (
    <div
      className="min-h-screen font-sans iv-mesh-bg iv-noise"
      style={{ background: "var(--iv-surface-0)", color: "var(--iv-text-primary)" }}
    >
      {/* Header */}
      <motion.nav
        className="iv-nav"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <a href="/" className="flex items-center gap-2 no-underline" style={{ color: "var(--iv-text-primary)" }}>
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
          <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>intervyu</span>
        </a>
        <div className="flex items-center gap-3">
          {interviewMeta.interviewType && (
            <span
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: "rgba(148, 163, 204, 0.08)",
                color: "var(--iv-text-secondary)",
                border: "1px solid var(--iv-border-subtle)",
              }}
            >
              {interviewMeta.interviewType} Interview
            </span>
          )}
          {interviewMeta.createdAt && (
            <span className="text-xs" style={{ color: "var(--iv-text-tertiary)" }}>
              {formatDate(interviewMeta.createdAt)}
            </span>
          )}
        </div>
      </motion.nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* ── Hero: Overall Score + Summary ──────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <GlassCard className="flex flex-col items-center gap-4 flex-shrink-0" delay={0.1}>
            <CircularProgress score={report.overallScore} />
            <motion.span
              className="text-sm font-semibold"
              style={{ color: scoreColor }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {grade}
            </motion.span>
          </GlassCard>

          <GlassCard className="flex-1 w-full" delay={0.2}>
            <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--iv-text-primary)" }}>
              Performance Summary
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--iv-text-secondary)" }}>
              {report.summary}
            </p>
          </GlassCard>
        </div>

        {/* ── Category Breakdown ─────────────────────────────────────── */}
        <GlassCard delay={0.3}>
          <h3 className="text-base font-semibold mb-6" style={{ color: "var(--iv-text-primary)" }}>
            Category Breakdown
          </h3>
          <div className="space-y-5">
            {report.categories.map((cat, i) => (
              <CategoryBar key={cat.name} category={cat} index={i} />
            ))}
          </div>
        </GlassCard>

        {/* ── Strengths & Weaknesses ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard delay={0.4}>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "rgba(34, 197, 94, 0.15)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(142, 71%, 45%)" strokeWidth="2.5">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              </div>
              <h3 className="text-base font-semibold" style={{ color: "var(--iv-text-primary)" }}>
                Strengths
              </h3>
            </div>
            <ul className="space-y-2.5">
              {report.strengths.map((s, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: "var(--iv-text-secondary)" }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(142, 71%, 45%)" }} />
                  {s}
                </motion.li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard delay={0.45}>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "rgba(245, 158, 11, 0.15)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(48, 96%, 53%)" strokeWidth="2.5">
                  <path d="M12 9v4M12 17h.01" />
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold" style={{ color: "var(--iv-text-primary)" }}>
                Areas to Improve
              </h3>
            </div>
            <ul className="space-y-2.5">
              {report.weaknesses.map((w, i) => (
                <motion.li
                  key={i}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: "var(--iv-text-secondary)" }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.08 }}
                >
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(48, 96%, 53%)" }} />
                  {w}
                </motion.li>
              ))}
            </ul>
          </GlassCard>
        </div>

        {/* ── Action Items ───────────────────────────────────────────── */}
        <GlassCard delay={0.5}>
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: "rgba(var(--iv-accent-rgb), 0.15)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--iv-accent))" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
              </svg>
            </div>
            <h3 className="text-base font-semibold" style={{ color: "var(--iv-text-primary)" }}>
              Next Steps
            </h3>
          </div>
          <ol className="space-y-3">
            {report.actionItems.map((item, i) => (
              <motion.li
                key={i}
                className="flex items-start gap-3 text-sm"
                style={{ color: "var(--iv-text-secondary)" }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
                  style={{
                    background: "rgba(var(--iv-accent-rgb), 0.15)",
                    color: "hsl(var(--iv-accent))",
                  }}
                >
                  {i + 1}
                </span>
                {item}
              </motion.li>
            ))}
          </ol>
        </GlassCard>

        {/* ── Transcript ─────────────────────────────────────────────── */}
        {transcript.length > 0 && (
          <GlassCard delay={0.55}>
            <button
              onClick={() => setTranscriptExpanded(!transcriptExpanded)}
              className="w-full flex items-center justify-between cursor-pointer"
              style={{ background: "transparent", border: "none" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ background: "rgba(148, 163, 204, 0.1)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--iv-text-secondary)" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold" style={{ color: "var(--iv-text-primary)" }}>
                  Full Transcript
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(148, 163, 204, 0.08)", color: "var(--iv-text-tertiary)" }}>
                  {transcript.length} messages
                </span>
              </div>
              <motion.svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--iv-text-tertiary)"
                strokeWidth="2"
                animate={{ rotate: transcriptExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <polyline points="6,9 12,15 18,9" />
              </motion.svg>
            </button>

            <AnimatePresence>
              {transcriptExpanded && (
                <motion.div
                  className="mt-5 space-y-4 max-h-[500px] overflow-y-auto pr-2"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {transcript.map((msg, i) => {
                    const isInterviewer = msg.role === "Interviewer";
                    return (
                      <div key={i} className={`flex ${isInterviewer ? "justify-start" : "justify-end"}`}>
                        <div
                          className="max-w-[80%] rounded-2xl px-4 py-3"
                          style={{
                            background: isInterviewer
                              ? "rgba(148, 163, 204, 0.06)"
                              : "rgba(var(--iv-accent-rgb), 0.08)",
                            border: `1px solid ${isInterviewer
                              ? "rgba(148, 163, 204, 0.08)"
                              : "rgba(var(--iv-accent-rgb), 0.12)"
                            }`,
                          }}
                        >
                          <span
                            className="text-xs font-medium block mb-1"
                            style={{
                              color: isInterviewer
                                ? "var(--iv-text-tertiary)"
                                : "hsl(var(--iv-accent))",
                            }}
                          >
                            {isInterviewer ? "Interviewer" : "You"}
                          </span>
                          <p className="text-sm leading-relaxed" style={{ color: "var(--iv-text-secondary)" }}>
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        )}

        {/* ── Documents ──────────────────────────────────────────────── */}
        {(interviewMeta.hasResume || interviewMeta.hasJd) && (
          <GlassCard delay={0.6}>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: "rgba(148, 163, 204, 0.1)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--iv-text-secondary)" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </div>
              <h3 className="text-base font-semibold" style={{ color: "var(--iv-text-primary)" }}>
                Documents Used
              </h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {interviewMeta.hasResume && (
                <a
                  href={`${BACKEND_URL}/api/v1/interview/${interviewId}/pdf/resume`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm no-underline transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "rgba(148, 163, 204, 0.06)",
                    border: "1px solid var(--iv-border-subtle)",
                    color: "var(--iv-text-secondary)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Resume.pdf
                </a>
              )}
              {interviewMeta.hasJd && (
                <a
                  href={`${BACKEND_URL}/api/v1/interview/${interviewId}/pdf/jd`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm no-underline transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    background: "rgba(148, 163, 204, 0.06)",
                    border: "1px solid var(--iv-border-subtle)",
                    color: "var(--iv-text-secondary)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Job Description.pdf
                </a>
              )}
            </div>
          </GlassCard>
        )}

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <motion.div
          className="flex justify-center pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <a
            href="/"
            className="px-8 py-3 rounded-xl text-sm font-medium no-underline transition-all duration-200 hover:scale-105"
            style={{
              background: "hsl(var(--iv-accent))",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(var(--iv-accent-rgb), 0.3)",
            }}
          >
            Start New Interview
          </a>
        </motion.div>
      </div>
    </div>
  );
}
