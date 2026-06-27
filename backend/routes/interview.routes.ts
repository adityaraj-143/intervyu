import type { Request, Response } from "express";
import { githubScraper } from "../scrapers/githubscraper";
import { db } from "../db";
import { PDFParse } from "pdf-parse";

export async function handleInterviewStart(req: Request, res: Response): Promise<void> {
  const { githubUsername, jobDescriptionText } = req.body;

  if (!githubUsername) {
    res.status(400).json({ error: "GitHub username is required" });
    return;
  }

  // ── Extract job description ─────────────────────────────────────────────
  let jobDescription: string | null = null;

  const pdfFile = (req as any).file; // set by multer when a PDF is uploaded
  if (pdfFile) {
    try {
      const parser = new PDFParse({ data: pdfFile.buffer });
      const result = await parser.getText();
      jobDescription = result.text.trim();
    } catch {
      res.status(400).json({ error: "Failed to parse PDF. Please try pasting the JD as text." });
      return;
    }
  } else if (jobDescriptionText?.trim()) {
    jobDescription = jobDescriptionText.trim();
  }

  // ── Scrape GitHub ───────────────────────────────────────────────────────
  let repos: Awaited<ReturnType<typeof githubScraper>>;
  try {
    repos = await githubScraper(githubUsername);
  } catch {
    res.status(404).json({ error: "GitHub user not found or API error" });
    return;
  }

  const repoSummary = repos
    .slice(0, 15)
    .map((r: { name: string; description: string | null; starCount: number }) =>
      `- ${r.name}${r.description ? `: ${r.description}` : ""} (⭐ ${r.starCount})`
    )
    .join("\n");

  // ── Build system prompt ─────────────────────────────────────────────────
  const jdSection = jobDescription
    ? `\nYou are interviewing on behalf of the company described in this job description. Represent that company and evaluate the candidate for this specific role:\n\n${jobDescription}\n`
    : `\nConduct a general senior software engineering interview.\n`;

  const systemPrompt = `You are a senior software engineer conducting a technical interview.
${jdSection}
The candidate's GitHub username is "${githubUsername}". Their public repositories are:
${repoSummary}

Use this context to tailor your questions — ask about specific projects, technologies, and patterns you see in their work. If a job description was provided, align your questions with the required skills and the company's tech focus. Start with a brief introduction and a targeted opening question.

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
      jobDescription,
      systemPrompt,
    },
  });

  res.status(200).json({ interviewId: interview.id });
}
