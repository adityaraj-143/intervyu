import type { RedisOptions } from "ioredis";

/**
 * BullMQ connection config.
 * Returns Redis connection options for BullMQ queues and workers.
 */
export function getQueueConnectionOpts(): { connection: RedisOptions } {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const parsed = new URL(url);

  return {
    connection: {
      host: parsed.hostname,
      port: parseInt(parsed.port || "6379"),
      maxRetriesPerRequest: null, // Required by BullMQ
    },
  };
}
