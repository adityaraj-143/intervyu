import { Queue } from "bullmq";
import { getQueueConnectionOpts } from "./connection";

export interface ReportJobData {
  interviewId: string;
  userId: string;
}

const QUEUE_NAME = "report-generation";

let queue: Queue | null = null;

function getReportQueue(): Queue {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, getQueueConnectionOpts());
  }
  return queue;
}

/**
 * Enqueue a report generation job.
 * Uses the interviewId as the job ID so duplicate enqueues for the same
 * interview are automatically deduplicated by BullMQ.
 */
export async function enqueueReportJob(interviewId: string, userId: string): Promise<string> {
  const q = getReportQueue();
  const job = await q.add(
    "generate-report",
    { interviewId, userId } satisfies ReportJobData,
    {
      jobId: `report-${interviewId}`,
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { age: 3600, count: 500 },    // Keep completed jobs for 1 hour
      removeOnFail: { age: 24 * 3600, count: 1000 },   // Keep failed jobs for 24 hours
    }
  );
  return job.id!;
}

export { QUEUE_NAME };
