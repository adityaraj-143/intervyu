"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { signupUser, googleAuth } from "@/lib/api";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import MagneticButton from "@/components/landing/MagneticButton";

function getPasswordStrength(pw: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 2) return { score, label: "Fair", color: "#f59e0b" };
  if (score <= 3) return { score, label: "Good", color: "#22c55e" };
  return { score, label: "Strong", color: "hsl(var(--iv-accent))" };
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSignup = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signupUser({ email: email.trim(), password, name: name.trim() });
      toast.success("Account created! Welcome to Intervyu.");
      router.push("/setup");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? "Signup failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleSignup();
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
          href="/login"
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
          Sign in →
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
                Get Started
              </motion.p>
              <motion.h1
                className="iv-heading-md mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Create your account
              </motion.h1>
              <motion.p
                className="iv-body"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Start practicing AI-powered interviews in minutes.
              </motion.p>
            </div>

            <div className="space-y-6" onKeyDown={handleKeyDown}>
              {/* ── Google Button ──────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5 }}
              >
                <div className="flex justify-center w-full">
                  <GoogleLogin
                    onSuccess={async (credentialResponse: CredentialResponse) => {
                      if (credentialResponse.credential) {
                        try {
                          setLoading(true);
                          await googleAuth(credentialResponse.credential);
                          toast.success("Account created! Welcome to Intervyu.");
                          router.push("/setup");
                        } catch (err: any) {
                          const msg = err?.response?.data?.error ?? "Google sign-in failed.";
                          toast.error(msg);
                        } finally {
                          setLoading(false);
                        }
                      }
                    }}
                    onError={() => {
                      toast.error("Google sign-in failed.");
                    }}
                    theme="filled_black"
                    shape="pill"
                    size="large"
                    text="signup_with"
                  />
                </div>
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

              {/* ── Name ──────────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.52, duration: 0.5 }}
              >
                <label
                  htmlFor="name"
                  className="block mb-2"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "var(--iv-text-primary)",
                  }}
                >
                  Full Name
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--iv-text-tertiary)" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M2.5 14c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <input
                    id="name"
                    type="text"
                    className="w-full"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
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

              {/* ── Email ─────────────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.57, duration: 0.5 }}
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
                transition={{ delay: 0.62, duration: 0.5 }}
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
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <motion.div
                    className="mt-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="flex-1 rounded-full overflow-hidden"
                        style={{
                          height: 3,
                          background: "var(--iv-surface-3)",
                        }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: strength.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(strength.score / 5) * 100}%` }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 500,
                          color: strength.color,
                          minWidth: 40,
                        }}
                      >
                        {strength.label}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--iv-text-tertiary)",
                        margin: 0,
                        lineHeight: 1.4,
                      }}
                    >
                      Use 8+ characters with uppercase, numbers & symbols
                    </p>
                  </motion.div>
                )}
              </motion.div>

              {/* ── Submit ─────────────────────────────────────────────── */}
              <motion.div
                className="pt-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.72, duration: 0.5 }}
              >
                <MagneticButton
                  onClick={handleSignup}
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
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Account
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </MagneticButton>
              </motion.div>

              {/* ── Terms & login link ─────────────────────────────────── */}
              <motion.div
                className="text-center space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.82, duration: 0.5 }}
              >
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--iv-text-tertiary)",
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--iv-text-secondary)",
                    margin: 0,
                  }}
                >
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="no-underline"
                    style={{
                      color: "hsl(var(--iv-accent))",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    Sign in
                  </a>
                </p>
              </motion.div>
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
            {/* Main visual — animated pipeline */}
            <motion.div
              className="iv-card-glass mb-8"
              style={{ padding: "36px 28px" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <motion.div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    background: "rgba(82, 102, 255, 0.06)",
                    border: "1px solid rgba(82, 102, 255, 0.12)",
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2l2.09 4.26L17 7.27l-3.5 3.41.83 4.82L10 13.27 5.67 15.5l.83-4.82L3 7.27l4.91-1.01L10 2z" stroke="hsl(var(--iv-accent))" strokeWidth="1.3" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--iv-text-primary)", marginBottom: 2 }}>
                    Your journey starts here
                  </p>
                  <p className="iv-body-sm" style={{ margin: 0, fontSize: "0.75rem" }}>
                    Set up in under 2 minutes
                  </p>
                </div>
              </div>

              {/* Steps visualization */}
              <div className="space-y-3">
                {[
                  { step: "01", label: "Create your account", active: true },
                  { step: "02", label: "Upload resume & connect GitHub", active: false },
                  { step: "03", label: "Start your AI interview", active: false },
                  { step: "04", label: "Get actionable feedback", active: false },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      background: item.active ? "rgba(82, 102, 255, 0.06)" : "transparent",
                      border: item.active
                        ? "1px solid rgba(82, 102, 255, 0.15)"
                        : "1px solid transparent",
                    }}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.7 + i * 0.1,
                      duration: 0.4,
                    }}
                  >
                    <span
                      className="flex items-center justify-center rounded-md"
                      style={{
                        width: 28,
                        height: 28,
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        fontFamily: "var(--font-geist-mono)",
                        background: item.active ? "rgba(82, 102, 255, 0.12)" : "var(--iv-surface-3)",
                        color: item.active ? "hsl(var(--iv-accent))" : "var(--iv-text-tertiary)",
                      }}
                    >
                      {item.step}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: item.active ? 500 : 400,
                        color: item.active ? "var(--iv-text-primary)" : "var(--iv-text-tertiary)",
                      }}
                    >
                      {item.label}
                    </span>
                    {item.active && (
                      <motion.div
                        className="ml-auto rounded-full"
                        style={{
                          width: 6,
                          height: 6,
                          background: "hsl(var(--iv-accent))",
                        }}
                        animate={{
                          opacity: [1, 0.4, 1],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Trust badges */}
            <div className="space-y-4">
              {[
                {
                  icon: "🔒",
                  title: "End-to-end encryption",
                  desc: "Your data is always protected",
                },
                {
                  icon: "🚀",
                  title: "Free to start",
                  desc: "No credit card required",
                },
                {
                  icon: "🌍",
                  title: "Used globally",
                  desc: "Engineers from 50+ countries",
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
                    delay: 0.9 + i * 0.12,
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
