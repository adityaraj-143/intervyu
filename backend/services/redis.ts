import Redis from "ioredis";

let redis: Redis | null = null;

/**
 * Returns a singleton Redis connection.
 * Uses REDIS_URL from env, defaults to localhost:6379.
 */
export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL ?? "redis://localhost:6379";
    redis = new Redis(url, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    });

    redis.on("connect", () => console.log("[Redis] Connected"));
    redis.on("error", (err) => console.error("[Redis] Connection error:", err.message));
  }
  return redis;
}
