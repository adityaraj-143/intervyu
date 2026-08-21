import Groq from "groq-sdk";

// ── Report JSON Schema ──────────────────────────────────────────────

export interface CategoryScore {
  name: string;
  score: number;
  feedback: string;
}

export interface InterviewReport {
  overallScore: number;
  summary: string;
  categories: CategoryScore[];
  strengths: string[];
  weaknesses: string[];
  actionItems: string[];
}

// ── Category definitions by interview type ──────────────────────────

const TECH_CATEGORIES = [
  "Problem Solving & DSA",
  "System Design",
  "Technical Knowledge",
  "Code Quality & Logic",
  "Communication",
];

const HR_CATEGORIES = [
  "STAR Method Usage",
  "Leadership & Initiative",
  "Conflict Resolution",
  "Cultural Fit & Values",
  "Communication & Clarity",
];

// ── Architecture context (transcription quirks) ─────────────────────

const ARCHITECTURE_CONTEXT = `
IMPORTANT CONTEXT ABOUT THIS INTERVIEW:
This was a voice-based mock interview conducted through a web application. Here is what you need to know about potential artifacts in the transcript:

1. SPEECH-TO-TEXT ARTIFACTS: The candidate's responses were captured via Google Cloud Speech-to-Text. Expect:
   - Misheard technical terms (e.g., "react" transcribed as "React", "docker" → "doctor", "kubernetes" → "cube and eats", "monster" → "MERN stack", "xjs" → "Next.js")
   - Filler words and stuttering artifacts ("um", "uh", repeated words)
   - Grammar errors that are transcription artifacts, NOT the candidate's actual speech quality
   - Missing punctuation or odd sentence breaks

2. RECONSTRUCTING INTENT: Since this is an STT transcript, you must actively reconstruct what the candidate likely meant by using the surrounding context. If a term makes no sense literally but sounds like a valid technical term, assume they meant the valid term.

3. INTERRUPTION TAGS: Messages from the interviewer ending with "[INTERRUPTED]" mean the candidate spoke over the AI before it finished. This is NORMAL conversational behavior and should NOT be penalized. It often indicates the candidate was engaged and eager to respond.

4. SILENCE/STRUGGLE: If the interviewer simplified a question or pivoted topics, it may indicate the candidate was struggling with the previous topic. Factor this into your evaluation.

EVALUATION RULES:
- Evaluate the INTENT and CONCEPTS behind what the candidate said, not the literal transcription quality
- Do NOT penalize for grammar, pronunciation, or transcription errors
- Actively reconstruct and correct technical jargon before judging correctness
- DO penalize for genuinely weak technical understanding, vague/surface-level answers, or inability to explain concepts
- DO reward clear logical thinking, structured approaches, and depth of understanding
- Treat [INTERRUPTED] messages as normal conversation flow
- CRITICAL: You must ONLY evaluate the candidate based on what they actually said in the [TRANSCRIPT]. Do NOT evaluate them based on their resume or job description summary.
- CRITICAL: If the transcript is too short or doesn't contain enough information to evaluate a specific category, you MUST give a score of 0 and explicitly state in the feedback that there was not enough data to evaluate. DO NOT GUESS OR HALLUCINATE SCORES based on the resume.
`.trim();

// ── Prompt builders ─────────────────────────────────────────────────

function buildReportPrompt(
  transcript: string,
  interviewType: "Technical" | "HR",
  resumeSummary: string | null,
  jdSummary: string | null,
): string {
  const categories = interviewType === "Technical" ? TECH_CATEGORIES : HR_CATEGORIES;

  const contextBlocks: string[] = [];
  if (resumeSummary) {
    contextBlocks.push(`### Candidate's Resume Summary\n${resumeSummary}`);
  }
  if (jdSummary) {
    contextBlocks.push(`### Job Description Summary\n${jdSummary}`);
  }

  const contextSection = contextBlocks.length > 0
    ? `\n\n[REFERENCE MATERIAL]\n${contextBlocks.join("\n\n")}`
    : "";

  return `You are an expert interview evaluator. Analyze the following ${interviewType} interview transcript and produce a detailed performance report.

${ARCHITECTURE_CONTEXT}
${contextSection}

[TRANSCRIPT]
${transcript}

[EVALUATION INSTRUCTIONS]
Grade the candidate on each of the following categories (score 0-100 for each):
${categories.map((c, i) => `${i + 1}. ${c}`).join("\n")}

For each category, provide:
- A score from 0-100
- A 1-2 sentence feedback explaining the score

Also provide:
- An overall score (0-100) — this is NOT a simple average. Weight it based on the importance of each category and how the candidate performed holistically.
- A 2-3 sentence summary of the candidate's overall performance
- 3-5 specific strengths (bullet points)
- 3-5 specific areas for improvement (bullet points)
- 2-4 actionable next steps the candidate should take to improve (be specific — recommend resources, practice areas, or techniques)

[OUTPUT FORMAT]
Respond with ONLY valid JSON matching this exact schema. No markdown, no code fences, no explanation outside the JSON:
{
  "overallScore": <number 0-100>,
  "summary": "<string>",
  "categories": [
    { "name": "<category name>", "score": <number 0-100>, "feedback": "<string>" }
  ],
  "strengths": ["<string>", ...],
  "weaknesses": ["<string>", ...],
  "actionItems": ["<string>", ...]
}`;
}

// ── Report generation ───────────────────────────────────────────────

export async function generateReport(
  transcript: string,
  interviewType: "Technical" | "HR",
  resumeSummary: string | null,
  jdSummary: string | null,
): Promise<InterviewReport> {
  const groq = new Groq();

  const prompt = buildReportPrompt(transcript, interviewType, resumeSummary, jdSummary);

  console.log("[Report] Generating report via Groq...");

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    max_completion_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("LLM returned empty response for report generation");
  }

  console.log("[Report] Raw LLM response received, parsing...");

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("[Report] Failed to parse LLM JSON:", raw);
    throw new Error("LLM returned invalid JSON for report");
  }

  // Validate required fields
  const report: InterviewReport = {
    overallScore: clamp(parsed.overallScore ?? 0, 0, 100),
    summary: parsed.summary ?? "No summary available.",
    categories: Array.isArray(parsed.categories)
      ? parsed.categories.map((c: any) => ({
          name: String(c.name ?? "Unknown"),
          score: clamp(c.score ?? 0, 0, 100),
          feedback: String(c.feedback ?? "No feedback."),
        }))
      : [],
    strengths: Array.isArray(parsed.strengths)
      ? parsed.strengths.map(String)
      : [],
    weaknesses: Array.isArray(parsed.weaknesses)
      ? parsed.weaknesses.map(String)
      : [],
    actionItems: Array.isArray(parsed.actionItems)
      ? parsed.actionItems.map(String)
      : [],
  };

  console.log(`[Report] Generated successfully. Overall score: ${report.overallScore}`);
  return report;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
