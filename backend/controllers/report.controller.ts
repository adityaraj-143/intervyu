import type { Request, Response } from "express";
import { db } from "../db";
import { generateReport } from "../services/report.service";
import { MessageRole } from "../generated/prisma/enums";
import { getPdfUrl, pdfExists } from "../services/storage.service";

/**
 * POST /api/v1/interview/:id/report
 * Triggers AI report generation for a completed interview.
 * Idempotent — returns cached report if one already exists.
 */
export async function handleGenerateReport(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const interview = await db.interview.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" as const } } },
    });

    if (!interview) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }

    if (interview.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    // Idempotent: return cached report if already generated
    if (interview.report) {
      res.status(200).json({ report: interview.report });
      return;
    }

    // Build transcript from messages
    const transcript = interview.messages
      .map((msg: { role: string; content: string }) => {
        const role = msg.role === MessageRole.Interviewer ? "Interviewer" : "Candidate";
        return `${role}: ${msg.content}`;
      })
      .join("\n\n");

    if (!transcript.trim()) {
      res.status(400).json({ error: "No transcript available for this interview" });
      return;
    }

    // Generate report via LLM
    const report = await generateReport(
      transcript,
      interview.interviewType as "Technical" | "HR",
      interview.resumeSummary,
      interview.jdSummary,
    );

    // Persist report and overall score
    await db.interview.update({
      where: { id },
      data: {
        report: report as any,
        score: report.overallScore,
      },
    });

    res.status(200).json({ report });
  } catch (err) {
    console.error("[Report] Generation error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
}

/**
 * GET /api/v1/interview/:id/report
 * Fetches the stored report (or returns pending status).
 */
export async function handleGetReport(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const interview = await db.interview.findUnique({
      where: { id },
      select: {
        userId: true,
        report: true,
        score: true,
        interviewType: true,
        createdAt: true,
        resumeSummary: true,
        jdSummary: true,
        resumeUrl: true,
        jdUrl: true,
      },
    });

    if (!interview) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }

    if (interview.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (!interview.report) {
      res.status(200).json({ status: "pending" });
      return;
    }

    res.status(200).json({
      report: interview.report,
      score: interview.score,
      interviewType: interview.interviewType,
      createdAt: interview.createdAt,
      hasResume: !!interview.resumeUrl,
      hasJd: !!interview.jdUrl,
    });
  } catch (err) {
    console.error("[Report] Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch report" });
  }
}

/**
 * GET /api/v1/interview/:id/transcript
 * Returns the full message transcript for the interview.
 */
export async function handleGetTranscript(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const interview = await db.interview.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!interview) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }

    if (interview.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const messages = await db.message.findMany({
      where: { interviewId: id },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true, createdAt: true },
    });

    res.status(200).json({ messages });
  } catch (err) {
    console.error("[Report] Transcript fetch error:", err);
    res.status(500).json({ error: "Failed to fetch transcript" });
  }
}

/**
 * GET /api/v1/interview/:id/pdf/:type
 * Serves the stored resume or JD PDF.
 */
export async function handleServePdf(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const type = req.params.type as string;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (type !== "resume" && type !== "jd") {
    res.status(400).json({ error: "Invalid PDF type. Must be 'resume' or 'jd'." });
    return;
  }

  try {
    const interview = await db.interview.findUnique({
      where: { id },
      select: { userId: true, resumeUrl: true, jdUrl: true },
    });

    if (!interview) {
      res.status(404).json({ error: "Interview not found" });
      return;
    }

    if (interview.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const exists = await pdfExists(id, type);
    if (!exists) {
      res.status(404).json({ error: "PDF not found" });
      return;
    }

    const presignedUrl = await getPdfUrl(id, type);
    res.redirect(presignedUrl);
  } catch (err) {
    console.error("[Report] PDF serve error:", err);
    res.status(500).json({ error: "Failed to serve PDF" });
  }
}
