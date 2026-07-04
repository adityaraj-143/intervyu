"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { loginUser } from "@/lib/api";
import MagneticButton from "@/components/landing/MagneticButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      await loginUser({ email: email.trim(), password });
      toast.success("Welcome back!");
      router.push("/setup");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Login failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleLogin();
    }
  };

  return (
    <main
      className="min-h-screen"
      style={{
        background: "var(--iv-surface-0)",
        color: "var(--iv-text-primary)",
      }}
    >
      {/* Top bar */}
      <nav
        className="flex items-center justify-between px-6 md:px-10 py-4"
        style={{ borderBottom: "1px solid var(--iv-border-subtle)" }}
      >
        <a
          href="/"
          className="flex items-center gap-2 no-underline"
          style={{ color: "var(--iv-text-primary)" }}
        >
          <div
            className="rounded-lg flex items-center justify-center"
            style={{
              width: 28,
              height: 28,
              background: "rgba(82, 102, 255, 0.1)",
              border: "1px solid rgba(82, 102, 255, 0.15)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="4" width="12" height="8" rx="2" stroke="hsl(var(--iv-accent))" strokeWidth="1.2"/>
              <path d="M4 4V3a3 3 0 016 0v1" stroke="hsl(var(--iv-accent))" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: "0.8125rem", fontWeight: 500 }}>intervyu</span>
        </a>
        <a
          href="/signup"
          className="no-underline"
          style={{
            fontSize: "0.8125rem",
            fontWeight: 500,
            color: "var(--iv-text-secondary)",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--iv-accent))")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--iv-text-secondary)")}
        >
          Create account →
        </a>
      </nav>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">
        {/* ── Left: Form ─────────────────────────────────────────────── */}
        <motion.div
          className="flex-1 flex items-start justify-center p-6 md:p-10 lg:p-16"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="w-full" style={{ maxWidth: 440 }}>
            {/* Header */}
            <div className="mb-10">
              <motion.p
                className="iv-label mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Welcome Back
              </motion.p>
              <motion.h1
                className="iv-heading-md mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Sign in to your account
              </motion.h1>
              <motion.p
                className="iv-body"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Continue your interview preparation where you left off.
              </motion.p>
            </div>

            <div className="space-y-6" onKeyDown={handleKeyDown}>
              {/* ── Google Button ──────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-3 rounded-xl transition-all duration-200"
                  style={{
                    padding: "13px 16px",
                    background: "var(--iv-surface-2)",
                    border: "1px solid var(--iv-border-subtle)",
                    color: "var(--iv-text-primary)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    outline: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--iv-border-medium)";
                    e.currentTarget.style.background = "var(--iv-surface-3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--iv-border-subtle)";
                    e.currentTarget.style.background = "var(--iv-surface-2)";
                  }}
                  onClick={() => toast.info("Google sign-in requires a configured Google Client ID")}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </motion.div>

              {/* ── Divider ───────────────────────────────────────────── */}
              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <div className="flex-1 iv-divider" />
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--iv-text-tertiary)",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  or
                </span>
                <div className="flex-1 iv-divider" />
              </motion.div>

              {/* ── Email ─────────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5 }}
              >
                <label
                  htmlFor="email"
                  className="block mb-2"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "var(--iv-text-primary)",
                  }}
                >
                  Email
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--iv-text-tertiary)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M2 4l6 4.5L14 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    className="w-full"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    style={{
                      background: "var(--iv-surface-2)",
                      border: "1px solid var(--iv-border-subtle)",
                      borderRadius: 12,
                      padding: "12px 14px 12px 36px",
                      fontSize: "0.875rem",
                      color: "var(--iv-text-primary)",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(82, 102, 255, 0.3)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--iv-border-subtle)";
                    }}
                  />
                </div>
              </motion.div>

              {/* ── Password ──────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <label
                  htmlFor="password"
                  className="block mb-2"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "var(--iv-text-primary)",
                  }}
                >
                  Password
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--iv-text-tertiary)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2.5" y="7" width="11" height="7.5" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{
                      background: "var(--iv-surface-2)",
                      border: "1px solid var(--iv-border-subtle)",
                      borderRadius: 12,
                      padding: "12px 40px 12px 36px",
                      fontSize: "0.875rem",
                      color: "var(--iv-text-primary)",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(82, 102, 255, 0.3)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--iv-border-subtle)";
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--iv-text-tertiary)",
                      cursor: "pointer",
                      padding: 2,
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M6.59 6.59a2 2 0 002.82 2.82" stroke="currentColor" strokeWidth="1.2"/>
                        <path d="M3.55 3.55C2.15 4.77 1.15 6.3.5 8c1.28 3.37 4.2 5.5 7.5 5.5a7.5 7.5 0 003.45-.85" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        <path d="M14.5 11c.6-.9 1-1.9 1-3-1.28-3.37-4.2-5.5-7.5-5.5-.5 0-1 .05-1.5.15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <ellipse cx="8" cy="8" rx="7.5" ry="4.5" stroke="currentColor" strokeWidth="1.2"/>
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </motion.div>

              {/* ── Submit ─────────────────────────────────────────────── */}
              <motion.div
                className="pt-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <MagneticButton
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="animate-spin"
                      >
                        <circle
                          cx="8"
                          cy="8"
                          r="6"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeDasharray="28"
                          strokeDashoffset="8"
                          strokeLinecap="round"
                        />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign In
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </MagneticButton>
              </motion.div>

              {/* ── Link to signup ─────────────────────────────────────── */}
              <motion.p
                className="text-center"
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--iv-text-secondary)",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="no-underline"
                  style={{
                    color: "hsl(var(--iv-accent))",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  Create one
                </a>
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* ── Right: Visual panel ──────────────────────────────────────── */}
        <motion.aside
          className="hidden lg:flex flex-col items-center justify-center flex-1"
          style={{
            background: "var(--iv-surface-1)",
            borderLeft: "1px solid var(--iv-border-subtle)",
            padding: "48px 40px",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div style={{ maxWidth: 380 }}>
            {/* Main visual card */}
            <motion.div
              className="iv-card-glass mb-8"
              style={{ padding: "40px 32px", textAlign: "center" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {/* Animated lock icon */}
              <motion.div
                className="mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{
                  width: 64,
                  height: 64,
                  background: "rgba(82, 102, 255, 0.06)",
                  border: "1px solid rgba(82, 102, 255, 0.12)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 0px rgba(82, 102, 255, 0)",
                    "0 0 30px rgba(82, 102, 255, 0.1)",
                    "0 0 0px rgba(82, 102, 255, 0)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect x="5" y="12" width="18" height="13" rx="3" stroke="hsl(var(--iv-accent))" strokeWidth="1.5"/>
                  <path d="M9 12V9a5 5 0 0110 0v3" stroke="hsl(var(--iv-accent))" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="14" cy="18.5" r="2" fill="hsl(var(--iv-accent))" opacity="0.6"/>
                </svg>
              </motion.div>

              <h3
                className="iv-heading-sm mb-2"
                style={{ fontSize: "1rem" }}
              >
                Secure & Private
              </h3>
              <p className="iv-body-sm" style={{ margin: 0, fontSize: "0.8125rem" }}>
                Your interview data is encrypted and never shared. Practice with complete confidence.
              </p>
            </motion.div>

            {/* Value props */}
            <div className="space-y-4">
              {[
                {
                  icon: "🎯",
                  title: "Role-specific",
                  desc: "Questions tailored to the exact position",
                },
                {
                  icon: "🧠",
                  title: "Adaptive",
                  desc: "AI adjusts to your skill level in real-time",
                },
                {
                  icon: "📊",
                  title: "Actionable",
                  desc: "Detailed feedback to help you improve",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{
                    background: "var(--iv-surface-2)",
                    border: "1px solid var(--iv-border-subtle)",
                  }}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.7 + i * 0.12,
                    duration: 0.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <span style={{ fontSize: "1rem", lineHeight: 1 }}>{item.icon}</span>
                  <div>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        color: "var(--iv-text-primary)",
                        marginBottom: 2,
                      }}
                    >
                      {item.title}
                    </p>
                    <p className="iv-body-sm" style={{ margin: 0, fontSize: "0.75rem" }}>
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.aside>
      </div>
    </main>
  );
}
