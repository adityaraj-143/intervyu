import type { Request, Response } from "express";
import { githubScraper } from "../scrapers/githubscraper";
import { db } from "../db";

export async function handleInterviewStart(req: Request, res: Response): Promise<void> {
  const { githubUsername } = req.body;

  if (!githubUsername) {
    res.status(400).json({ error: "GitHub username is required" });
    return;
  }

  let repos: Awaited<ReturnType<typeof githubScraper>>;
  try {
    repos = await githubScraper(githubUsername);
  } catch {
    res.status(404).json({ error: "GitHub user not found or API error" });
    return;
  }

  // Build a plain-text summary of the candidate's repos for the system prompt
  const repoSummary = repos
    .slice(0, 15) // cap to avoid absurdly long prompts
    .map((r: { name: string; description: string | null; starCount: number }) =>
      `- ${r.name}${r.description ? `: ${r.description}` : ""} (⭐ ${r.starCount})`
    )
    .join("\n");

  const systemPrompt = `You are a senior software engineer conducting a technical interview.

The candidate's GitHub username is "${githubUsername}". Their public repositories are:
${repoSummary}

Use this context to tailor your questions — ask about specific projects, technologies, and patterns you see in their work. Start with an introduction and a targeted opening question based on their most interesting or complex-looking project.

Your responses will be converted to speech. Follow these rules:
- Use natural, conversational language. Speak like a real interviewer.
- Keep responses concise — one question or one follow-up at a time.
- Use proper punctuation to indicate pauses and sentence boundaries.
- Avoid markdown, bullet points, tables, code blocks, emojis, and special formatting.
- Do not repeat what the candidate already said.
- Ask one question at a time; do not multi-barrel.
- When the candidate answers, ask a deeper follow-up or pivot to a related topic.

Respond with plain text only.`;

  const interview = await db.interview.create({
    data: {
      githubUsername,
      githubMetadata: repos as object[],
      systemPrompt,
    },
  });

  res.status(200).json({ interviewId: interview.id });
}

