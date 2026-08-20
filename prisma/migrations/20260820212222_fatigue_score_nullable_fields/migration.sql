-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FatigueScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "acuteLoad" REAL NOT NULL,
    "chronicLoad" REAL NOT NULL,
    "acwr" REAL,
    "monotony" REAL,
    "strain" REAL,
    "recoveryIndex" REAL,
    "score" REAL,
    "zone" TEXT,
    "recommendation" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FatigueScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FatigueScore" ("acuteLoad", "acwr", "chronicLoad", "computedAt", "date", "id", "monotony", "recommendation", "recoveryIndex", "score", "strain", "userId", "zone") SELECT "acuteLoad", "acwr", "chronicLoad", "computedAt", "date", "id", "monotony", "recommendation", "recoveryIndex", "score", "strain", "userId", "zone" FROM "FatigueScore";
DROP TABLE "FatigueScore";
ALTER TABLE "new_FatigueScore" RENAME TO "FatigueScore";
CREATE INDEX "FatigueScore_userId_date_idx" ON "FatigueScore"("userId", "date");
CREATE UNIQUE INDEX "FatigueScore_userId_date_key" ON "FatigueScore"("userId", "date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
