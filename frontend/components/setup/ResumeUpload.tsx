"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ResumeUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export default function ResumeUpload({ file, onFileChange }: ResumeUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped && dropped.type === "application/pdf") {
        onFileChange(dropped);
      }
    },
    [onFileChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFileChange(e.target.files?.[0] ?? null);
    },
    [onFileChange]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const removeFile = useCallback(() => {
    onFileChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onFileChange]);

  return (
    <div>
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="relative cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Upload resume PDF"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            style={{
              border: `1.5px dashed ${
                isDragging ? "rgba(82, 102, 255, 0.5)" : "var(--iv-border-medium)"
              }`,
              borderRadius: 16,
              padding: "40px 24px",
              textAlign: "center",
              background: isDragging
                ? "rgba(82, 102, 255, 0.04)"
                : "var(--iv-glass-bg)",
              transition: "all 0.3s ease",
            }}
          >
            {/* Icon */}
            <div
              className="mx-auto mb-4 flex items-center justify-center rounded-xl"
              style={{
                width: 52,
                height: 52,
                background: isDragging
                  ? "rgba(82, 102, 255, 0.12)"
                  : "rgba(82, 102, 255, 0.06)",
                border: "1px solid rgba(82, 102, 255, 0.1)",
                transition: "all 0.3s ease",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: "hsl(var(--iv-accent))" }}
              >
                <path
                  d="M12 4v12m0-12L8 8m4-4l4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <p
              style={{
                color: "var(--iv-text-primary)",
                fontSize: "0.875rem",
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              {isDragging ? "Drop your resume here" : "Drag & drop your resume"}
            </p>
            <p className="iv-body-sm" style={{ margin: 0 }}>
              or{" "}
              <span style={{ color: "hsl(var(--iv-accent))", fontWeight: 500 }}>
                browse files
              </span>{" "}
              · PDF only
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
              aria-hidden="true"
            />
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="iv-card"
            style={{
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              borderColor: "rgba(82, 102, 255, 0.15)",
            }}
          >
            {/* File icon */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-lg"
              style={{
                width: 44,
                height: 44,
                background: "rgba(82, 102, 255, 0.08)",
                border: "1px solid rgba(82, 102, 255, 0.12)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                  stroke="hsl(var(--iv-accent))"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 2v6h6"
                  stroke="hsl(var(--iv-accent))"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 15h6M9 11h3"
                  stroke="hsl(var(--iv-accent))"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p
                className="truncate"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--iv-text-primary)",
                  marginBottom: 2,
                }}
              >
                {file.name}
              </p>
              <p className="iv-body-sm" style={{ margin: 0, fontSize: "0.75rem" }}>
                {formatSize(file.size)} · PDF
              </p>
            </div>

            {/* Success check */}
            <div
              className="flex-shrink-0 flex items-center justify-center rounded-full"
              style={{
                width: 28,
                height: 28,
                background: "rgba(52, 211, 153, 0.1)",
                border: "1px solid rgba(52, 211, 153, 0.2)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7l3 3 5-5"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Remove button */}
            <button
              onClick={removeFile}
              className="flex-shrink-0 flex items-center justify-center rounded-lg"
              style={{
                width: 28,
                height: 28,
                background: "transparent",
                border: "1px solid var(--iv-border-subtle)",
                color: "var(--iv-text-tertiary)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              aria-label="Remove file"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--iv-border-subtle)";
                e.currentTarget.style.color = "var(--iv-text-tertiary)";
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 2l8 8M10 2l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileSelect}
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
