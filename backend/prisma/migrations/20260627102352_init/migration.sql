-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('Interviewee', 'Interviewer');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('Pending', 'Inprogress', 'Completed');

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "githubMetadata" JSONB NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "status" "InterviewStatus" NOT NULL DEFAULT 'Inprogress',
    "score" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
