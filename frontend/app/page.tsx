"use client";

import { BACKEND_URL } from "@/config";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

type JdMode = "text" | "pdf";

export default function Home() {
  const [githubUsername, setGithubUsername] = useState<string>("");
  const [jdMode, setJdMode] = useState<JdMode>("text");
  const [jdText, setJdText] = useState<string>("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const jdFileInputRef = useRef<HTMLInputElement>(null);
  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();

  const handleClick = async () => {
    if (!githubUsername.trim()) {
      toast.error("Please enter a GitHub username");
      return;
    }

    if (jdMode === "pdf" && !pdfFile) {
      toast.error("Please upload a PDF or switch to text mode");
      return;
    }

    if (!resumeFile) {
      toast.error("Please upload a resume");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("githubUsername", githubUsername.trim());

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
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black gap-4 p-8">
      <h1 className="text-2xl font-bold">Start Interview</h1>

      {/* GitHub username */}
      <input
        className="border rounded px-3 py-2 w-80"
        placeholder="GitHub username"
        value={githubUsername}
        onChange={(e) => setGithubUsername(e.target.value)}
      />

      {/* JD section */}
      <div className="flex flex-col w-80 gap-2">
        <p className="text-sm text-zinc-500">Job Description (optional)</p>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            className={`flex-1 py-1 rounded text-sm border transition-colors ${jdMode === "text" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-transparent"}`}
            onClick={() => setJdMode("text")}
          >
            Paste text
          </button>
          <button
            className={`flex-1 py-1 rounded text-sm border transition-colors ${jdMode === "pdf" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-transparent"}`}
            onClick={() => setJdMode("pdf")}
          >
            Upload PDF
          </button>
        </div>

        {jdMode === "text" ? (
          <textarea
            className="border rounded px-3 py-2 w-full h-32 text-sm resize-none"
            placeholder="Paste the job description here..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
        ) : (
          <div
            className="border-2 border-dashed rounded px-3 py-6 text-center text-sm text-zinc-400 cursor-pointer hover:border-zinc-500 transition-colors"
            onClick={() => jdFileInputRef.current?.click()}
          >
            {pdfFile ? (
              <span className="text-zinc-700 dark:text-zinc-300">📄 {pdfFile.name}</span>
            ) : (
              "Click to upload JD PDF"
            )}
            <input
              ref={jdFileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}
      </div>

      {/* Resume section */}
      <div className="flex flex-col w-80 gap-2">
        <p className="text-sm text-zinc-500">Resume (required)</p>
        <div
          className="border-2 border-dashed rounded px-3 py-6 text-center text-sm text-zinc-400 cursor-pointer hover:border-zinc-500 transition-colors"
          onClick={() => resumeFileInputRef.current?.click()}
        >
          {resumeFile ? (
            <span className="text-zinc-700 dark:text-zinc-300">📄 {resumeFile.name}</span>
          ) : (
            "Click to upload Resume PDF"
          )}
          <input
            ref={resumeFileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <button
        onClick={handleClick}
        disabled={loading}
        className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded font-medium disabled:opacity-50 mt-2"
      >
        {loading ? "Starting..." : "Start Interview"}
      </button>
    </div>
  );
}
