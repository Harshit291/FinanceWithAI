/*
  Warnings:

  - Added the required column `reportId` to the `AiReport` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AiReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "reportJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AiReport" ("createdAt", "id", "reportJson", "symbol", "userId") SELECT "createdAt", "id", "reportJson", "symbol", "userId" FROM "AiReport";
DROP TABLE "AiReport";
ALTER TABLE "new_AiReport" RENAME TO "AiReport";
CREATE INDEX "AiReport_userId_symbol_createdAt_idx" ON "AiReport"("userId", "symbol", "createdAt");
CREATE UNIQUE INDEX "AiReport_userId_reportId_key" ON "AiReport"("userId", "reportId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
