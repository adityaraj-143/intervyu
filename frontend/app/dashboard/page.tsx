"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import api, { getMe, logoutUser } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────

interface CategoryScore {
  name: string;
  score: number;
  feedback: string;
}

interface DashboardInterview {
  id: string;
  interviewType: "Technical" | "HR";
  status: "Pending" | "Inprogress" | "Completed";
  score: number;
  createdAt: string;
  reportSummary: string | null;
  reportCategories: CategoryScore[] | null;
}

interface User {
  userId: string;
  name: string;
  email: string;
}

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
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusConfig(status: string) {
  switch (status) {
    case "Completed":
      return {
        label: "Completed",
        color: "hsl(142, 71%, 45%)",
        bg: "rgba(34, 197, 94, 0.1)",
        border: "rgba(34, 197, 94, 0.2)",
      };
    case "Inprogress":
      return {
        label: "In Progress",
        color: "hsl(48, 96%, 53%)",
        bg: "rgba(234, 179, 8, 0.1)",
        border: "rgba(234, 179, 8, 0.2)",
      };
    default:
      return {
        label: "Pending",
        color: "var(--iv-text-tertiary)",
        bg: "rgba(148, 163, 204, 0.06)",
        border: "rgba(148, 163, 204, 0.1)",
      };
  }
}

// ── Mini Score Ring ──────────────────────────────────────────────────

function MiniScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 204, 0.08)"
          strokeWidth={strokeWidth}
        />
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
          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold tabular-nums" style={{ color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

// ── Interview Card ──────────────────────────────────────────────────

function InterviewCard({
  interview,
  index,
}: {
  interview: DashboardInterview;
  index: number;
}) {
  const router = useRouter();
  const statusConfig = getStatusConfig(interview.status);
  const isCompleted = interview.status === "Completed";
  const hasReport = isCompleted && interview.reportSummary;

  return (
    <motion.div
      className="group relative rounded-2xl cursor-pointer"
      style={{
        background: "var(--iv-glass-bg)",
        border: "1px solid var(--iv-glass-border)",
        backdropFilter: "blur(12px)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.06, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{
        y: -4,
        borderColor: "rgba(82, 102, 255, 0.2)",
        boxShadow: "0 8px 32px rgba(82, 102, 255, 0.08)",
      }}
      onClick={() => {
        if (isCompleted) {
          router.push(`/interview/${interview.id}/report`);
        }
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-[1px]"
        style={{
          background: isCompleted
            ? `linear-gradient(90deg, transparent, ${getScoreColor(interview.score)}40, transparent)`
            : "linear-gradient(90deg, transparent, rgba(148, 163, 204, 0.1), transparent)",
        }}
      />

      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {/* Interview type badge */}
            <div
              className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-semibold uppercase tracking-wider"
              style={{
                background:
                  interview.interviewType === "Technical"
                    ? "rgba(82, 102, 255, 0.1)"
                    : "rgba(168, 85, 247, 0.1)",
                color:
                  interview.interviewType === "Technical"
                    ? "hsl(var(--iv-accent))"
                    : "hsl(270, 70%, 65%)",
                border: `1px solid ${
                  interview.interviewType === "Technical"
                    ? "rgba(82, 102, 255, 0.15)"
                    : "rgba(168, 85, 247, 0.15)"
                }`,
              }}
            >
              {interview.interviewType}
            </div>
            {/* Status badge */}
            <div
              className="px-2.5 py-1 rounded-lg text-[0.6875rem] font-medium"
              style={{
                background: statusConfig.bg,
                color: statusConfig.color,
                border: `1px solid ${statusConfig.border}`,
              }}
            >
              {statusConfig.label}
            </div>
          </div>

          {/* Score ring or dash */}
          {isCompleted && interview.score > 0 ? (
            <MiniScoreRing score={interview.score} />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: "rgba(148, 163, 204, 0.06)" }}
            >
              <span className="text-sm" style={{ color: "var(--iv-text-tertiary)" }}>
                —
              </span>
            </div>
          )}
        </div>

        {/* Date */}
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.4 }}>
            <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="var(--iv-text-secondary)" strokeWidth="1" />
            <path d="M1.5 5.5h11" stroke="var(--iv-text-secondary)" strokeWidth="1" />
            <path d="M4.5 1v2M9.5 1v2" stroke="var(--iv-text-secondary)" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span className="text-xs" style={{ color: "var(--iv-text-tertiary)" }}>
            {formatDate(interview.createdAt)} · {formatTime(interview.createdAt)}
          </span>
        </div>

        {/* Score grade */}
        {isCompleted && interview.score > 0 && (
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium"
              style={{ color: getScoreColor(interview.score) }}
            >
              {getScoreGrade(interview.score)}
            </span>
            <span className="text-xs" style={{ color: "var(--iv-text-tertiary)" }}>
              Performance
            </span>
          </div>
        )}

        {/* Summary snippet */}
        {hasReport && (
          <p
            className="text-[0.8125rem] leading-relaxed line-clamp-2"
            style={{ color: "var(--iv-text-secondary)" }}
          >
            {interview.reportSummary}
          </p>
        )}

        {/* Category mini bars (top 3) */}
        {isCompleted && interview.reportCategories && interview.reportCategories.length > 0 && (
          <div className="space-y-2 pt-1">
            {interview.reportCategories.slice(0, 3).map((cat) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[0.6875rem]" style={{ color: "var(--iv-text-tertiary)" }}>
                    {cat.name}
                  </span>
                  <span
                    className="text-[0.6875rem] font-medium tabular-nums"
                    style={{ color: getScoreColor(cat.score) }}
                  >
                    {cat.score}
                  </span>
                </div>
                <div
                  className="h-1 rounded-full overflow-hidden"
                  style={{ background: "rgba(148, 163, 204, 0.06)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: getScoreColor(cat.score) }}
                    initial={{ width: 0 }}
                    animate={{ width: `${cat.score}%` }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View report footer */}
        {isCompleted && (
          <div
            className="flex items-center gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <span className="text-xs font-medium" style={{ color: "hsl(var(--iv-accent))" }}>
              View Report
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M4.5 2.5l4 3.5-4 3.5"
                stroke="hsl(var(--iv-accent))"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Stats Bar ───────────────────────────────────────────────────────

function StatsBar({ interviews }: { interviews: DashboardInterview[] }) {
  const total = interviews.length;
  const completed = interviews.filter((iv) => iv.status === "Completed").length;
  const completedWithScore = interviews.filter(
    (iv) => iv.status === "Completed" && iv.score > 0
  );
  const avgScore =
    completedWithScore.length > 0
      ? Math.round(
          completedWithScore.reduce((sum, iv) => sum + iv.score, 0) /
            completedWithScore.length
        )
      : 0;

  const stats = [
    {
      label: "Total Interviews",
      value: total.toString(),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="3" width="12" height="10" rx="2" stroke="hsl(var(--iv-accent))" strokeWidth="1.2" />
          <path d="M5 7h6M5 10h3" stroke="hsl(var(--iv-accent))" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Completed",
      value: completed.toString(),
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="hsl(142, 71%, 45%)" strokeWidth="1.2" />
          <path d="M5.5 8l2 2 3.5-4" stroke="hsl(142, 71%, 45%)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Average Score",
      value: avgScore > 0 ? avgScore.toString() : "—",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2l1.5 3.1 3.4.5-2.5 2.4.6 3.4L8 9.6l-3 1.8.6-3.4-2.5-2.4 3.4-.5L8 2z" stroke="hsl(48, 96%, 53%)" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      ),
      color: avgScore > 0 ? getScoreColor(avgScore) : undefined,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-3 gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            background: "var(--iv-glass-bg)",
            border: "1px solid var(--iv-glass-border)",
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(82, 102, 255, 0.06)" }}
          >
            {stat.icon}
          </div>
          <div>
            <div
              className="text-xl font-bold tabular-nums"
              style={{ color: stat.color || "var(--iv-text-primary)" }}
            >
              {stat.value}
            </div>
            <div className="text-[0.6875rem]" style={{ color: "var(--iv-text-tertiary)" }}>
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────

function EmptyState() {
  const router = useRouter();

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: "rgba(82, 102, 255, 0.06)",
          border: "1px solid rgba(82, 102, 255, 0.1)",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect x="5" y="8" width="26" height="20" rx="3" stroke="hsl(var(--iv-accent))" strokeWidth="1.5" />
          <circle cx="18" cy="17" r="4" stroke="hsl(var(--iv-accent))" strokeWidth="1.5" />
          <path d="M12 24c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="hsl(var(--iv-accent))" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: "var(--iv-text-primary)" }}
      >
        No interviews yet
      </h3>
      <p
        className="text-sm text-center max-w-xs mb-6"
        style={{ color: "var(--iv-text-secondary)" }}
      >
        Start your first AI-powered mock interview and get detailed performance feedback.
      </p>
      <button
        onClick={() => router.push("/setup")}
        className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
        style={{
          background: "hsl(var(--iv-accent))",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = "brightness(1.15)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(82, 102, 255, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = "brightness(1)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        Start Interview
      </button>
    </motion.div>
  );
}

// ── Loading Skeleton ────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 h-[72px]"
            style={{ background: "rgba(148, 163, 204, 0.04)", border: "1px solid rgba(148, 163, 204, 0.06)" }}
          />
        ))}
      </div>
      {/* Card skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl h-[260px]"
            style={{ background: "rgba(148, 163, 204, 0.04)", border: "1px solid rgba(148, 163, 204, 0.06)" }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard Page ─────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [interviews, setInterviews] = useState<DashboardInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "Technical" | "HR">("all");

  useEffect(() => {
    async function load() {
      try {
        const [meRes, ivRes] = await Promise.all([
          getMe(),
          api.get("/api/v1/interview"),
        ]);
        setUser(meRes.data);
        setInterviews(ivRes.data.interviews);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const filtered =
    filter === "all"
      ? interviews
      : interviews.filter((iv) => iv.interviewType === filter);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch { /* ignore */ }
    router.push("/login");
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--iv-surface-0)" }}
    >
      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{
          background: "rgba(8, 9, 14, 0.85)",
          backdropFilter: "blur(16px) saturate(1.6)",
          borderBottom: "1px solid var(--iv-border-subtle)",
        }}
      >
        <div
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center"
            style={{
              background: "rgba(82, 102, 255, 0.1)",
              border: "1px solid rgba(82, 102, 255, 0.15)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="4" width="12" height="8" rx="2" stroke="hsl(var(--iv-accent))" strokeWidth="1.2" />
              <path d="M4 4V3a3 3 0 016 0v1" stroke="hsl(var(--iv-accent))" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--iv-text-primary)" }}>
            intervyu
          </span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="text-sm font-medium mr-2" style={{ color: "var(--iv-text-secondary)" }}>
                {user.name}
              </span>
              <button
                onClick={() => router.push("/setup")}
                className="px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "#fff",
                  background: "rgba(82, 102, 255, 0.15)",
                  border: "1px solid rgba(82, 102, 255, 0.25)",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(82, 102, 255, 0.25)";
                  e.currentTarget.style.borderColor = "rgba(82, 102, 255, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(82, 102, 255, 0.15)";
                  e.currentTarget.style.borderColor = "rgba(82, 102, 255, 0.25)";
                }}
              >
                New Interview
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "var(--iv-text-secondary)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--iv-text-primary)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--iv-text-secondary)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div
          className="flex items-end justify-between"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: "var(--iv-text-primary)" }}
            >
              Your Interviews
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--iv-text-tertiary)" }}>
              Review your past performances and track your progress.
            </p>
          </div>
        </motion.div>

        {loading ? (
          <LoadingSkeleton />
        ) : interviews.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Stats */}
            <StatsBar interviews={interviews} />

            {/* Filter tabs */}
            <motion.div
              className="flex items-center gap-1 p-1 rounded-xl w-fit"
              style={{
                background: "rgba(148, 163, 204, 0.04)",
                border: "1px solid var(--iv-border-subtle)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {(["all", "Technical", "HR"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                  style={{
                    background: filter === f ? "rgba(82, 102, 255, 0.12)" : "transparent",
                    color:
                      filter === f ? "hsl(var(--iv-accent))" : "var(--iv-text-tertiary)",
                    border:
                      filter === f
                        ? "1px solid rgba(82, 102, 255, 0.15)"
                        : "1px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  {f === "all" ? "All" : f}
                </button>
              ))}
            </motion.div>

            {/* Interview cards grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={filter}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {filtered.length > 0 ? (
                  filtered.map((iv, i) => (
                    <InterviewCard key={iv.id} interview={iv} index={i} />
                  ))
                ) : (
                  <motion.div
                    className="col-span-full py-12 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-sm" style={{ color: "var(--iv-text-tertiary)" }}>
                      No {filter} interviews found.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
