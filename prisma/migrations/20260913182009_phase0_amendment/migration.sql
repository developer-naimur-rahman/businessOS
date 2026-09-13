-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "JournalLine" ADD COLUMN     "departmentId" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Dhaka';

-- CreateIndex
CREATE INDEX "JournalLine_departmentId_idx" ON "JournalLine"("departmentId");

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
