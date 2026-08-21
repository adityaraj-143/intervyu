import type { Request, Response } from "express";
import { githubScraper } from "../scrapers/githubscraper";
import { db } from "../db";
import { PDFParse } from "pdf-parse";
import { summarizeJD, summarizeResume } from "../services/summarize.service";
import { buildSystemPrompt } from "../utils/buildSystemPrompt";
import { savePdf } from "../services/storage.service";

/**
 * GET /api/v1/interview
 * Lists all interviews for the authenticated user, ordered by most recent first.
 */
export async function handleListInterviews(req: Request, res: Response): Promise<void> {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const interviews = await db.interview.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        interviewType: true,
        status: true,
        score: true,
        report: true,
        createdAt: true,
      },
    });

    // Return lightweight report data (summary + categories only)
    const result = interviews.map((iv) => {
      const report = iv.report as Record<string, unknown> | null;
      return {
        id: iv.id,
        interviewType: iv.interviewType,
        status: iv.status,
        score: iv.score,
        createdAt: iv.createdAt,
        reportSummary: report?.summary ?? null,
        reportCategories: report?.categories ?? null,
      };
    });

    res.status(200).json({ interviews: result });
  } catch (err) {
    console.error("[Interview] List error:", err);
    res.status(500).json({ error: "Failed to list interviews" });
  }
}

export async function handleInterviewStart(req: Request, res: Response): Promise<void> {
  const { githubUsername, jobDescriptionText, interviewType: rawType, voiceId } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const interviewType: "technical" | "hr" =
    rawType === "hr" ? "hr" : "technical";

  const isTechnical = interviewType === "technical";

  // ── Validate required fields per interview type ──────────────────────────
  if (isTechnical && !githubUsername) {
    res.status(400).json({ error: "GitHub username is required for technical interviews" });
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

  // HR interviews require a JD since it's the primary source for questions
  if (!isTechnical && !rawJdText) {
    res.status(400).json({ error: "Job description is required for HR interviews" });
    return;
  }

  // ── Run external calls in parallel ───────────────────────────────────────
  // For HR interviews: skip GitHub scraping entirely to save resources
  const [reposResult, jdSummaryResult, resumeSummaryResult] = await Promise.allSettled([
    isTechnical ? githubScraper(githubUsername) : Promise.resolve(null),
    rawJdText ? summarizeJD(rawJdText) : Promise.resolve(null),
    rawResumeText ? summarizeResume(rawResumeText) : Promise.resolve(null)
  ]);

  if (isTechnical && reposResult.status === "rejected") {
    res.status(404).json({ error: "GitHub user not found or API error" });
    return;
  }

  const repos = reposResult.status === "fulfilled" ? reposResult.value : null;
  const jdSummary = jdSummaryResult.status === "fulfilled" ? jdSummaryResult.value : null;
  const resumeSummary = resumeSummaryResult.status === "fulfilled" ? resumeSummaryResult.value : null;

  const repoSummary = isTechnical && repos
    ? repos
        .slice(0, 15)
        .map((r: { name: string; description: string | null; starCount: number }) =>
          `- ${r.name}${r.description ? `: ${r.description}` : ""} (⭐ ${r.starCount})`
        )
        .join("\n")
    : undefined;

  // ── Build system prompt ─────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt({
    interviewType,
    repoSummary,
    jdSummary,
    resumeSummary,
  });

  const interview = await db.interview.create({
    data: {
      userId,
      githubUsername: isTechnical ? githubUsername : null,
      githubMetadata: isTechnical && repos ? (repos as object[]) : undefined,
      jdSummary,
      resumeSummary,
      systemPrompt,
      voiceId: voiceId || "JBFqnCBsd6RMkjVDRZzb",
      interviewType: isTechnical ? "Technical" : "HR",
    },
  });

  res.status(200).json({ interviewId: interview.id });

  // ── Save PDFs to storage (fire-and-forget, non-blocking) ────────────
  (async () => {
    try {
      let resumeUrl: string | null = null;
      let jdUrl: string | null = null;

      if (resumePdfFile?.buffer) {
        resumeUrl = await savePdf(interview.id, "resume", resumePdfFile.buffer);
      }
      if (jdPdfFile?.buffer) {
        jdUrl = await savePdf(interview.id, "jd", jdPdfFile.buffer);
      }

      if (resumeUrl || jdUrl) {
        await db.interview.update({
          where: { id: interview.id },
          data: {
            ...(resumeUrl && { resumeUrl }),
            ...(jdUrl && { jdUrl }),
          },
        });
        console.log(`[interview] PDFs saved for ${interview.id}`);
      }
    } catch (err) {
      console.error(`[interview] Failed to save PDFs for ${interview.id}:`, err);
    }
  })();
}
