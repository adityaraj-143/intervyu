import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.resolve(import.meta.dir, "..", "uploads");

/**
 * Save a PDF buffer to local storage.
 * Directory structure: uploads/{interviewId}/resume.pdf or jd.pdf
 *
 * Returns the relative URL path for serving (e.g., "/uploads/{interviewId}/resume.pdf")
 *
 * This is designed as a thin abstraction — swap internals to S3 later
 * by changing only this file.
 */
export async function savePdf(
  interviewId: string,
  type: "resume" | "jd",
  buffer: Buffer
): Promise<string> {
  const dir = path.join(UPLOADS_DIR, interviewId);
  await fs.mkdir(dir, { recursive: true });

  const filename = type === "resume" ? "resume.pdf" : "jd.pdf";
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buffer);

  return `/uploads/${interviewId}/${filename}`;
}

/**
 * Get the absolute filesystem path for a stored PDF.
 */
export function getPdfAbsolutePath(
  interviewId: string,
  type: "resume" | "jd"
): string {
  const filename = type === "resume" ? "resume.pdf" : "jd.pdf";
  return path.join(UPLOADS_DIR, interviewId, filename);
}

/**
 * Check if a PDF file exists.
 */
export async function pdfExists(
  interviewId: string,
  type: "resume" | "jd"
): Promise<boolean> {
  try {
    await fs.access(getPdfAbsolutePath(interviewId, type));
    return true;
  } catch {
    return false;
  }
}

export { UPLOADS_DIR };
