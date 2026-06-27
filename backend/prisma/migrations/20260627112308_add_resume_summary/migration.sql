/*
  Warnings:

  - You are about to drop the column `jobDescription` on the `Interview` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "jobDescription",
ADD COLUMN     "jdSummary" TEXT,
ADD COLUMN     "resumeSummary" TEXT;
