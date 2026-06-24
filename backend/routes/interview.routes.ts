import axios from "axios";
import type { Request, Response } from "express";
import { githubScraper } from "../scrapers/githubscraper";

export async function handleInterviewStart(req: Request, res: Response): Promise<void> {
  const { githubUsername } = req.body;

  //TODO: webscrape the user's profile and repos

  if (!githubUsername) {
   res.status(400).json({ error: "GitHub username is required" });
  }

  const resp = await axios.get(`https:/github.com/${githubUsername}`);
  if(resp.status !== 200) {
    res.status(404).json({ error: "GitHub user not found" });
  }

  const userData = githubScraper(githubUsername);


  res.status(200).json({ message: "Interview started", interviewId: 1 });
}
