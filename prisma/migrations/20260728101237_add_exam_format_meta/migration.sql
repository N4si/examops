-- AlterTable
ALTER TABLE "certifications" ADD COLUMN     "examDurationMinutes" INTEGER NOT NULL DEFAULT 90,
ADD COLUMN     "examQuestionCount" INTEGER NOT NULL DEFAULT 65;
