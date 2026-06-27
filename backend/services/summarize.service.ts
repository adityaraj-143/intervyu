import Groq from "groq-sdk";

export async function summarizeJD(rawText: string): Promise<string> {
  const groq = new Groq();
  const prompt = `Extract ONLY: role title, required tech stack, key responsibilities, seniority level. Ignore CTC, benefits, offers, legal, EEO. Max 150 words. Plain text only.

Job Description:
${rawText}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    max_completion_tokens: 250,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

export async function summarizeResume(rawText: string): Promise<string> {
  const groq = new Groq();
  const prompt = `Structure into: Skills & Technologies, Experience (years + roles + companies), Notable Projects, Education. Keep all technical detail. Max 300 words. Plain text only.

Resume:
${rawText}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    max_completion_tokens: 450,
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}
