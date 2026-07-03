"use client";

import { BACKEND_URL } from "@/config";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ResumeUpload from "@/components/setup/ResumeUpload";
import VoiceSelector from "@/components/setup/VoiceSelector";
import MagneticButton from "@/components/landing/MagneticButton";

type JdMode = "text" | "pdf";
type InterviewType = "technical" | "hr";

export default function SetupPage() {
  const [interviewType, setInterviewType] = useState<InterviewType>("technical");
  const [githubUsername, setGithubUsername] = useState<string>("");
  const [jdMode, setJdMode] = useState<JdMode>("text");
  const [jdText, setJdText] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("professional");

  const jdFileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const isTechnical = interviewType === "technical";

  const hasJD =
    (jdMode === "text" && jdText.trim().length > 0) ||
    (jdMode === "pdf" && pdfFile !== null);

  const handleClick = async () => {
    if (isTechnical && !githubUsername.trim()) {
      toast.error("Please enter a GitHub username");
      return;
    }

    if (jdMode === "pdf" && !pdfFile && (isTechnical ? false : true)) {
      toast.error("Please upload a JD PDF or switch to text mode");
      return;
    }

    if (!isTechnical && !hasJD) {
      toast.error("Job description is required for HR interviews");
      return;
    }

    if (!resumeFile) {
      toast.error("Please upload a resume");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("interviewType", interviewType);

      if (isTechnical) {
        formData.append("githubUsername", githubUsername.trim());
      }

      if (jdMode === "text" && jdText.trim()) {
        formData.append("jobDescriptionText", jdText.trim());
      } else if (jdMode === "pdf" && pdfFile) {
        formData.append("jobDescriptionPdf", pdfFile);
      }

      if (resumeFile) {
        formData.append("resumePdf", resumeFile);
      }

      const resp = await axios.post(`${BACKEND_URL}/api/v1/interview`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (resp.status === 200) {
        router.push(`/interview/${resp.data.interviewId}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Something went wrong");
    } finally {
      setLoading(false);
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
      </nav>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-57px)]">
        {/* ── Left: Form ─────────────────────────────────────────────── */}
        <motion.div
          className="flex-1 flex items-start justify-center p-6 md:p-10 lg:p-16"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="w-full" style={{ maxWidth: 520 }}>
            {/* Header */}
            <div className="mb-10">
              <motion.p
                className="iv-label mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Interview Setup
              </motion.p>
              <motion.h1
                className="iv-heading-md mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Prepare for your interview
              </motion.h1>
              <motion.p
                className="iv-body"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Configure your session below. We&apos;ll tailor questions to your background and the role.
              </motion.p>
            </div>

            <div className="space-y-8">
              {/* ── Interview Type Toggle ─────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.5 }}
              >
                <label
                  className="block mb-3"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "var(--iv-text-primary)",
                  }}
                >
                  Interview Type
                  <span style={{ color: "hsl(var(--iv-accent))", marginLeft: 4 }}>*</span>
                </label>
                <div
                  className="grid grid-cols-2 gap-3"
                  role="radiogroup"
                  aria-label="Interview type selection"
                >
                  {/* Technical option */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isTechnical}
                    onClick={() => setInterviewType("technical")}
                    className="relative text-left rounded-xl transition-all duration-200"
                    style={{
                      padding: "16px",
                      background: isTechnical
                        ? "rgba(82, 102, 255, 0.06)"
                        : "var(--iv-surface-2)",
                      border: isTechnical
                        ? "1.5px solid rgba(82, 102, 255, 0.35)"
                        : "1.5px solid var(--iv-border-subtle)",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>🖥️</span>
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 550,
                          color: isTechnical
                            ? "hsl(var(--iv-accent))"
                            : "var(--iv-text-primary)",
                        }}
                      >
                        Technical
                      </span>
                    </div>
                    <p
                      className="iv-body-sm"
                      style={{
                        margin: 0,
                        fontSize: "0.7rem",
                        lineHeight: 1.4,
                        color: "var(--iv-text-tertiary)",
                      }}
                    >
                      Coding, system design &amp; technical deep-dives
                    </p>
                    {/* Active indicator dot */}
                    {isTechnical && (
                      <motion.div
                        layoutId="interviewTypeIndicator"
                        className="absolute top-3 right-3 rounded-full"
                        style={{
                          width: 8,
                          height: 8,
                          background: "hsl(var(--iv-accent))",
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>

                  {/* HR option */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={!isTechnical}
                    onClick={() => setInterviewType("hr")}
                    className="relative text-left rounded-xl transition-all duration-200"
                    style={{
                      padding: "16px",
                      background: !isTechnical
                        ? "rgba(82, 102, 255, 0.06)"
                        : "var(--iv-surface-2)",
                      border: !isTechnical
                        ? "1.5px solid rgba(82, 102, 255, 0.35)"
                        : "1.5px solid var(--iv-border-subtle)",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>🤝</span>
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          fontWeight: 550,
                          color: !isTechnical
                            ? "hsl(var(--iv-accent))"
                            : "var(--iv-text-primary)",
                        }}
                      >
                        HR / Behavioral
                      </span>
                    </div>
                    <p
                      className="iv-body-sm"
                      style={{
                        margin: 0,
                        fontSize: "0.7rem",
                        lineHeight: 1.4,
                        color: "var(--iv-text-tertiary)",
                      }}
                    >
                      Behavioral, situational &amp; culture-fit questions
                    </p>
                    {!isTechnical && (
                      <motion.div
                        layoutId="interviewTypeIndicator"
                        className="absolute top-3 right-3 rounded-full"
                        style={{
                          width: 8,
                          height: 8,
                          background: "hsl(var(--iv-accent))",
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* ── GitHub Username (technical only) ───────────────────── */}
              <AnimatePresence>
                {isTechnical && (
                  <motion.div
                    key="github-field"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <label
                      htmlFor="github-username"
                      className="block mb-2"
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        color: "var(--iv-text-primary)",
                      }}
                    >
                      GitHub Username
                      <span style={{ color: "hsl(var(--iv-accent))", marginLeft: 4 }}>*</span>
                    </label>
                    <div className="relative">
                      <span
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--iv-text-tertiary)" }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 1a7 7 0 00-2.21 13.64c.35.06.48-.15.48-.33v-1.17c-1.94.42-2.35-.93-2.35-.93a1.85 1.85 0 00-.78-1.02c-.63-.43.05-.42.05-.42a1.47 1.47 0 011.07.72 1.49 1.49 0 002.04.58 1.49 1.49 0 01.44-.93c-1.55-.18-3.18-.78-3.18-3.46a2.7 2.7 0 01.72-1.88 2.51 2.51 0 01.07-1.85s.59-.19 1.92.72a6.63 6.63 0 013.5 0c1.33-.9 1.92-.72 1.92-.72a2.51 2.51 0 01.07 1.85 2.7 2.7 0 01.72 1.88c0 2.69-1.64 3.28-3.19 3.46a1.67 1.67 0 01.47 1.29v1.92c0 .18.13.4.48.33A7 7 0 008 1z" fill="currentColor"/>
                        </svg>
                      </span>
                      <input
                        id="github-username"
                        type="text"
                        className="w-full"
                        placeholder="e.g. torvalds"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
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
                )}
              </AnimatePresence>

              {/* ── Resume Upload ─────────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.5 }}
              >
                <label
                  className="block mb-2"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "var(--iv-text-primary)",
                  }}
                >
                  Resume
                  <span style={{ color: "hsl(var(--iv-accent))", marginLeft: 4 }}>*</span>
                </label>
                <ResumeUpload file={resumeFile} onFileChange={setResumeFile} />
              </motion.div>

              {/* ── Job Description ───────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.5 }}
              >
                <label
                  className="block mb-2"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "var(--iv-text-primary)",
                  }}
                >
                  Job Description
                  {isTechnical ? (
                    <span className="iv-body-sm ml-2" style={{ fontWeight: 400, fontSize: "0.75rem" }}>
                      (optional)
                    </span>
                  ) : (
                    <span style={{ color: "hsl(var(--iv-accent))", marginLeft: 4 }}>*</span>
                  )}
                </label>

                {/* Mode toggle */}
                <div
                  className="inline-flex rounded-lg p-0.5 mb-3"
                  style={{
                    background: "var(--iv-surface-2)",
                    border: "1px solid var(--iv-border-subtle)",
                  }}
                  role="radiogroup"
                  aria-label="Job description input mode"
                >
                  <button
                    className="relative px-4 py-1.5 rounded-md transition-all duration-200"
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      background: jdMode === "text" ? "rgba(82, 102, 255, 0.1)" : "transparent",
                      color: jdMode === "text" ? "hsl(var(--iv-accent))" : "var(--iv-text-tertiary)",
                      border: "none",
                      cursor: "pointer",
                      outline: "none",
                    }}
                    onClick={() => setJdMode("text")}
                    role="radio"
                    aria-checked={jdMode === "text"}
                  >
                    Paste Text
                  </button>
                  <button
                    className="relative px-4 py-1.5 rounded-md transition-all duration-200"
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      background: jdMode === "pdf" ? "rgba(82, 102, 255, 0.1)" : "transparent",
                      color: jdMode === "pdf" ? "hsl(var(--iv-accent))" : "var(--iv-text-tertiary)",
                      border: "none",
                      cursor: "pointer",
                      outline: "none",
                    }}
                    onClick={() => setJdMode("pdf")}
                    role="radio"
                    aria-checked={jdMode === "pdf"}
                  >
                    Upload PDF
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {jdMode === "text" ? (
                    <motion.div
                      key="jd-text"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <textarea
                        className="w-full resize-none"
                        placeholder="Paste the job description here..."
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                        rows={5}
                        style={{
                          background: "var(--iv-surface-2)",
                          border: "1px solid var(--iv-border-subtle)",
                          borderRadius: 12,
                          padding: "12px 14px",
                          fontSize: "0.875rem",
                          color: "var(--iv-text-primary)",
                          outline: "none",
                          transition: "border-color 0.2s ease",
                          lineHeight: 1.6,
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "rgba(82, 102, 255, 0.3)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = "var(--iv-border-subtle)";
                        }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="jd-pdf"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className="cursor-pointer group"
                        onClick={() => jdFileInputRef.current?.click()}
                        style={{
                          border: "1.5px dashed var(--iv-border-medium)",
                          borderRadius: 12,
                          padding: "24px 16px",
                          textAlign: "center",
                          background: "var(--iv-glass-bg)",
                          transition: "all 0.3s ease",
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Upload job description PDF"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            jdFileInputRef.current?.click();
                          }
                        }}
                      >
                        {pdfFile ? (
                          <div className="flex items-center justify-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M9 1H4a1.5 1.5 0 00-1.5 1.5v11A1.5 1.5 0 004 15h8a1.5 1.5 0 001.5-1.5V5.5L9 1z" stroke="hsl(var(--iv-accent))" strokeWidth="1.2" strokeLinejoin="round"/>
                              <path d="M9 1v4.5h4.5" stroke="hsl(var(--iv-accent))" strokeWidth="1.2" strokeLinejoin="round"/>
                            </svg>
                            <span
                              style={{
                                fontSize: "0.8125rem",
                                color: "var(--iv-text-primary)",
                                fontWeight: 450,
                              }}
                            >
                              {pdfFile.name}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPdfFile(null);
                              }}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--iv-text-tertiary)",
                                cursor: "pointer",
                                padding: 2,
                              }}
                              aria-label="Remove file"
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <p className="iv-body-sm" style={{ margin: 0 }}>
                            Click to upload JD as PDF
                          </p>
                        )}
                        <input
                          ref={jdFileInputRef}
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                          aria-hidden="true"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* ── Voice Selection ───────────────────────────────────── */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.5 }}
              >
                <label
                  className="block mb-2"
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: "var(--iv-text-primary)",
                  }}
                >
                  Interviewer Voice
                </label>
                <VoiceSelector selected={selectedVoice} onSelect={setSelectedVoice} />
              </motion.div>

              {/* ── Start Button ──────────────────────────────────────── */}
              <motion.div
                className="pt-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85, duration: 0.5 }}
              >
                <MagneticButton
                  onClick={handleClick}
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
                      Preparing Interview...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Start {isTechnical ? "Technical" : "HR"} Interview
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </MagneticButton>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* ── Right: Visual context ──────────────────────────────────── */}
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
            {/* Visual card */}
            <motion.div
              className="iv-card-glass mb-8"
              style={{ padding: "32px 28px" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="rounded-full"
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(82, 102, 255, 0.08)",
                    border: "1px solid rgba(82, 102, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="1.5" width="6" height="9" rx="3" stroke="hsl(var(--iv-accent))" strokeWidth="1.2"/>
                    <path d="M3 8.5a5 5 0 0010 0" stroke="hsl(var(--iv-accent))" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M8 13.5v1.5" stroke="hsl(var(--iv-accent))" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--iv-text-primary)", marginBottom: 1 }}>
                    Voice Interview
                  </p>
                  <p className="iv-body-sm" style={{ margin: 0, fontSize: "0.6875rem" }}>
                    Natural conversation with AI
                  </p>
                </div>
              </div>

              {/* Fake waveform */}
              <div className="flex items-center gap-[3px]" style={{ height: 40, padding: "0 4px" }}>
                {Array.from({ length: 32 }, (_, i) => {
                  const h = Math.sin(i * 0.4) * 12 + Math.random() * 8 + 6;
                  return (
                    <motion.div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: 2.5,
                        background: `rgba(82, 102, 255, ${0.2 + Math.random() * 0.3})`,
                      }}
                      animate={{
                        height: [h, h * 0.6, h * 1.2, h],
                      }}
                      transition={{
                        duration: 1.5 + Math.random() * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.04,
                      }}
                    />
                  );
                })}
              </div>
            </motion.div>

            {/* Info cards */}
            <div className="space-y-4">
              {[
                {
                  icon: "⚡",
                  title: "Adaptive difficulty",
                  desc: "Questions adjust to your skill level in real-time",
                },
                {
                  icon: "🎯",
                  title: "Role-specific",
                  desc: "Tailored to the exact position you're targeting",
                },
                {
                  icon: "📊",
                  title: "Detailed feedback",
                  desc: "Comprehensive scoring across multiple dimensions",
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
                    delay: 0.8 + i * 0.12,
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
