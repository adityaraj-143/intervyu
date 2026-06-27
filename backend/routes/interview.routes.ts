import type { Request, Response } from "express";
import { githubScraper } from "../scrapers/githubscraper";
import { db } from "../db";
import { PDFParse } from "pdf-parse";
import { summarizeJD, summarizeResume } from "../services/summarize.service";
import { buildSystemPrompt } from "../utils/buildSystemPrompt";

export async function handleInterviewStart(req: Request, res: Response): Promise<void> {
  const { githubUsername, jobDescriptionText } = req.body;

  if (!githubUsername) {
    res.status(400).json({ error: "GitHub username is required" });
    return;
  }

  // ── Extract raw files ───────────────────────────────────────────────────
  const files = (req as any).files as { [fieldname: string]: any[] } | undefined;
  const jdPdfFile = files?.["jobDescriptionPdf"]?.[0];
  const resumePdfFile = files?.["resumePdf"]?.[0];

  if (!resumePdfFile) {
    res.status(400).json({ error: "Resume PDF is required" });
    return;
  }

  let rawJdText: string | null = null;
  let rawResumeText: string | null = null;

  try {
    if (jdPdfFile) {
      const parser = new PDFParse({ data: jdPdfFile.buffer });
      rawJdText = (await parser.getText()).text.trim();
    } else if (jobDescriptionText?.trim()) {
      rawJdText = jobDescriptionText.trim();
    }

    if (resumePdfFile) {
      const parser = new PDFParse({ data: resumePdfFile.buffer });
      rawResumeText = (await parser.getText()).text.trim();
    }
  } catch {
    res.status(400).json({ error: "Failed to parse one or more PDF files." });
    return;
  }

  // ── Run external calls in parallel ───────────────────────────────────────
  const [reposResult, jdSummaryResult, resumeSummaryResult] = await Promise.allSettled([
    githubScraper(githubUsername),
    rawJdText ? summarizeJD(rawJdText) : Promise.resolve(null),
    rawResumeText ? summarizeResume(rawResumeText) : Promise.resolve(null)
  ]);

  if (reposResult.status === "rejected") {
    res.status(404).json({ error: "GitHub user not found or API error" });
    return;
  }

  const repos = reposResult.value;
  const jdSummary = jdSummaryResult.status === "fulfilled" ? jdSummaryResult.value : null;
  const resumeSummary = resumeSummaryResult.status === "fulfilled" ? resumeSummaryResult.value : null;

  const repoSummary = repos
    .slice(0, 15)
    .map((r: { name: string; description: string | null; starCount: number }) =>
      `- ${r.name}${r.description ? `: ${r.description}` : ""} (⭐ ${r.starCount})`
    )
    .join("\n");

  // ── Build system prompt ─────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt({ repoSummary, jdSummary, resumeSummary });

  const interview = await db.interview.create({
    data: {
      githubUsername,
      githubMetadata: repos as object[],
      jdSummary,
      resumeSummary,
      systemPrompt,
    },
  });

  res.status(200).json({ interviewId: interview.id });
}
