import axios from "axios";
import { getRedis } from "../services/redis";

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export async function githubScraper(username: string) {
  const redis = getRedis();
  const cacheKey = `github:repos:${username.toLowerCase()}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log(`[GitHub] Cache HIT for ${username}`);
    return JSON.parse(cached);
  }

  console.log(`[GitHub] Cache MISS for ${username}, calling API...`);
  const response = await axios.get(
    `https://api.github.com/users/${username}/repos`,
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
    },
  );

  const repos = response.data.map((repo: any) => ({
    name: repo.name,
    description: repo.description,
    fullName: repo.full_name,
    starCount: repo.stargazers_count,
  }));

  // Store in Redis with TTL
  await redis.set(cacheKey, JSON.stringify(repos), "EX", CACHE_TTL_SECONDS);
  console.log(`[GitHub] Cached ${repos.length} repos for ${username} (TTL: 24h)`);

  return repos;
}
