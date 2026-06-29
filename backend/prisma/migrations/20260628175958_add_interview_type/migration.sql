-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('Technical', 'HR');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "interviewType" "InterviewType" NOT NULL DEFAULT 'Technical',
ALTER COLUMN "githubUsername" DROP NOT NULL,
ALTER COLUMN "githubMetadata" DROP NOT NULL;
