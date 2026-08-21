/**
 * Report Generation Worker
 *
 * Run as a separate process: `bun run workers/report.worker.ts`
 *
 * Picks up report generation jobs from the BullMQ queue,
 * calls the LLM via report.service.ts, and persists results to the DB.
 */

import { Worker } from "bullmq";
import { getRedis } from "../services/redis";
import { getQueueConnectionOpts } from "../queue/connection";
import { QUEUE_NAME, type ReportJobData } from "../queue/report.queue";
import { db } from "../db";
import { generateReport } from "../services/report.service";
import { MessageRole } from "../generated/prisma/enums";

const REPORT_STATUS_TTL = 3600; // 1 hour

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { interviewId, userId } = job.data as ReportJobData;
    const redis = getRedis();
    const statusKey = `report:status:${interviewId}`;

    console.log(`[report-worker] Processing job ${job.id} for interview ${interviewId}`);

    try {
      // Mark as processing
      await redis.set(statusKey, JSON.stringify({ status: "processing" }), "EX", REPORT_STATUS_TTL);

      // Fetch interview + messages
      const interview = await db.interview.findUnique({
        where: { id: interviewId },
        include: { messages: { orderBy: { createdAt: "asc" as const } } },
      });

      if (!interview) {
        throw new Error(`Interview ${interviewId} not found`);
      }

      if (interview.userId !== userId) {
        throw new Error(`User ${userId} does not own interview ${interviewId}`);
      }

      // Skip if report already exists (idempotent)
      if (interview.report) {
        console.log(`[report-worker] Report already exists for ${interviewId}, skipping`);
        await redis.set(
          statusKey,
          JSON.stringify({ status: "completed" }),
          "EX",
          REPORT_STATUS_TTL
        );
        return;
      }

      // Build transcript
      const transcript = interview.messages
        .map((msg: { role: string; content: string }) => {
          const role = msg.role === MessageRole.Interviewer ? "Interviewer" : "Candidate";
          return `${role}: ${msg.content}`;
        })
        .join("\n\n");

      if (!transcript.trim()) {
        throw new Error(`No transcript available for interview ${interviewId}`);
      }

      // Generate report via LLM (the heavy 5-15s call)
      const report = await generateReport(
        transcript,
        interview.interviewType as "Technical" | "HR",
        interview.resumeSummary,
        interview.jdSummary,
      );

      // Persist to DB
      await db.interview.update({
        where: { id: interviewId },
        data: {
          report: report as any,
          score: report.overallScore,
        },
      });

      // Mark as completed in Redis
      await redis.set(
        statusKey,
        JSON.stringify({ status: "completed" }),
        "EX",
        REPORT_STATUS_TTL
      );

      console.log(`[report-worker] Report generated for ${interviewId} (score: ${report.overallScore})`);
    } catch (err) {
      console.error(`[report-worker] Failed for ${interviewId}:`, err);

      // Mark as failed in Redis
      const redis = getRedis();
      await redis.set(
        `report:status:${interviewId}`,
        JSON.stringify({
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        }),
        "EX",
        REPORT_STATUS_TTL
      );

      throw err; // Re-throw so BullMQ retries
    }
  },
  {
    ...getQueueConnectionOpts(),
    concurrency: 3, // Process up to 3 reports in parallel
  }
);

worker.on("completed", (job) => {
  console.log(`[report-worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[report-worker] Job ${job?.id} failed:`, err.message);
});

console.log("[report-worker] Worker started, waiting for jobs...");
