/*
  Warnings:

  - You are about to drop the column `mentorId` on the `clubs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "clubs" DROP CONSTRAINT "clubs_mentorId_fkey";

-- DropIndex
DROP INDEX "clubs_mentorId_idx";

-- AlterTable
ALTER TABLE "clubs" DROP COLUMN "mentorId",
ADD COLUMN     "convenorId" INTEGER,
ADD COLUMN     "maxCoordinators" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "maxMentors" INTEGER NOT NULL DEFAULT 3;

-- CreateTable
CREATE TABLE "_ClubMentors" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ClubMentors_AB_unique" ON "_ClubMentors"("A", "B");

-- CreateIndex
CREATE INDEX "_ClubMentors_B_index" ON "_ClubMentors"("B");

-- CreateIndex
CREATE INDEX "clubs_convenorId_idx" ON "clubs"("convenorId");

-- AddForeignKey
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_convenorId_fkey" FOREIGN KEY ("convenorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClubMentors" ADD CONSTRAINT "_ClubMentors_A_fkey" FOREIGN KEY ("A") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClubMentors" ADD CONSTRAINT "_ClubMentors_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
