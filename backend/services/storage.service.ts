import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET = process.env.S3_BUCKET_NAME ?? "intervyu-pdfs";

/** Presigned URL TTL in seconds (15 minutes) */
const PRESIGN_TTL = 5 * 60;

/**
 * Build a consistent S3 object key for a PDF.
 * Format: pdfs/{interviewId}/resume.pdf  or  pdfs/{interviewId}/jd.pdf
 */
function getS3Key(interviewId: string, type: "resume" | "jd"): string {
  const filename = type === "resume" ? "resume.pdf" : "jd.pdf";
  return `pdfs/${interviewId}/${filename}`;
}

/**
 * Upload a PDF buffer to S3.
 *
 * Returns the S3 object key (e.g., "pdfs/{interviewId}/resume.pdf").
 * The key is stored in the DB — presigned URLs are generated on-the-fly when serving.
 */
export async function savePdf(
  interviewId: string,
  type: "resume" | "jd",
  buffer: Buffer
): Promise<string> {
  const key = getS3Key(interviewId, type);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: "application/pdf",
    })
  );

  return key;
}

/**
 * Generate a presigned GET URL for a stored PDF.
 * The URL is valid for 15 minutes.
 */
export async function getPdfUrl(
  interviewId: string,
  type: "resume" | "jd"
): Promise<string> {
  const key = getS3Key(interviewId, type);

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
    { expiresIn: PRESIGN_TTL }
  );

  return url;
}

/**
 * Check if a PDF exists in S3.
 */
export async function pdfExists(
  interviewId: string,
  type: "resume" | "jd"
): Promise<boolean> {
  const key = getS3Key(interviewId, type);

  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (err: any) {
    // S3 returns NotFound or 404 for missing objects
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}
