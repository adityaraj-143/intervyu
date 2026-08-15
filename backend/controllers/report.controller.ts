import type { Request, Response } from "express";
import { db } from "../db";
import { enqueueReportJob } from "../queue/report.queue";
import { getRedis } from "../services/redis";
import { getPdfUrl, pdfExists } from "../services/storage.service";

/**
 * POST /api/v1/interview/:id/report
 * Triggers AI report generation for a completed interview.
 * Idempotent — returns cached report if one already exists.
 * Otherwise enqueues a background job and returns 202.
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
      select: {
        userId: true,
        report: true,
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

    // Idempotent: return cached report if already generated
    if (interview.report) {
      res.status(200).json({ report: interview.report });
      return;
    }

    // Enqueue background job for report generation
    const jobId = await enqueueReportJob(id, userId);
    console.log(`[Report] Enqueued report job ${jobId} for interview ${id}`);

    res.status(202).json({ status: "processing", jobId });
  } catch (err) {
    console.error("[Report] Enqueue error:", err);
    res.status(500).json({ error: "Failed to start report generation" });
  }
}

/**
 * GET /api/v1/interview/:id/report
 * Fetches the stored report. If the report is still being generated,
 * checks Redis for job status and returns it.
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

    // Report is ready — return it
    if (interview.report) {
      res.status(200).json({
        status: "completed",
        report: interview.report,
        score: interview.score,
        interviewType: interview.interviewType,
        createdAt: interview.createdAt,
        hasResume: !!interview.resumeUrl,
        hasJd: !!interview.jdUrl,
      });
      return;
    }

    // Report not in DB yet — check Redis for job status
    const redis = getRedis();
    const statusRaw = await redis.get(`report:status:${id}`);

    if (statusRaw) {
      const statusData = JSON.parse(statusRaw);
      res.status(200).json(statusData);
      return;
    }

    // No report and no status — hasn't been triggered yet
    res.status(200).json({ status: "pending" });
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
