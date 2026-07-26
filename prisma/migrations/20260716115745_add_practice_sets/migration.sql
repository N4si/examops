-- AlterTable
ALTER TABLE "certifications" ADD COLUMN     "description" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "practiceSetId" TEXT;

-- CreateTable
CREATE TABLE "practice_sets" (
    "id" TEXT NOT NULL,
    "certId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practice_sets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "practice_sets_certId_number_key" ON "practice_sets"("certId", "number");

-- AddForeignKey
ALTER TABLE "practice_sets" ADD CONSTRAINT "practice_sets_certId_fkey" FOREIGN KEY ("certId") REFERENCES "certifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_practiceSetId_fkey" FOREIGN KEY ("practiceSetId") REFERENCES "practice_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
