import type { Request, Response } from "express";

export function handleInterviewStart(req: Request, res: Response): void {
  const { githubUsername } = req.body;

  //TODO: webscrape the user's profile and repos

  if (!githubUsername) {
    res.status(400).json({ error: "GitHub username is required" });
    return;
  }

  res.status(200).json({ message: "Interview started", interviewId: 1 });
}
