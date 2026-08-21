"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { loginUser, googleAuth } from "@/lib/api";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
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
      className="min-h-screen iv-mesh-bg iv-mesh-bg-centered iv-noise relative"
      style={{
        background: "var(--iv-surface-0)",
        color: "var(--iv-text-primary)",
      }}
    >
      {/* Top bar */}
      <nav className="iv-nav">
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
        <a
          href="/signup"
          className="no-underline text-sm font-medium transition-colors duration-200 hover:text-[hsl(var(--iv-accent))]"
          style={{
            color: "var(--iv-text-secondary)",
          }}
        >
          Create account →
        </a>
      </nav>

      {/* ── Centered Form Card ─────────────────────────────────────── */}
      <div className="flex items-center justify-center px-6 relative" style={{ minHeight: "calc(100vh - 57px)" }}>
        <motion.div
          className="w-full iv-card-glass relative"
          style={{ maxWidth: 440, padding: "40px 36px" }}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Header */}
          <div className="mb-8 text-center">
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
              Continue your interview preparation.
            </motion.p>
          </div>

          <div className="space-y-5" onKeyDown={handleKeyDown}>
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
                        toast.success("Welcome back!");
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
                  text="continue_with"
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
                  className="iv-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
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
                  className="iv-input"
                  style={{ paddingRight: 40 }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
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
              className="pt-1"
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
                className="no-underline hover:underline"
                style={{
                  color: "hsl(var(--iv-accent))",
                  fontWeight: 500,
                }}
              >
                Create one
              </a>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
