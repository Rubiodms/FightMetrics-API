-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bodyweightKg" REAL,
    "sport" TEXT NOT NULL DEFAULT 'MMA',
    "timezone" TEXT NOT NULL DEFAULT 'America/Bogota',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrainingLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "rpe" INTEGER NOT NULL,
    "sessionLoad" REAL NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyCheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "sleepHours" REAL NOT NULL,
    "sleepQuality" INTEGER NOT NULL,
    "muscleSoreness" INTEGER NOT NULL,
    "energyLevel" INTEGER NOT NULL,
    "stressLevel" INTEGER NOT NULL,
    "bodyweightKg" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FatigueScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "acuteLoad" REAL NOT NULL,
    "chronicLoad" REAL NOT NULL,
    "acwr" REAL NOT NULL,
    "monotony" REAL NOT NULL,
    "strain" REAL NOT NULL,
    "recoveryIndex" REAL NOT NULL,
    "score" REAL NOT NULL,
    "zone" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "computedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FatigueScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TrainingLog_userId_date_idx" ON "TrainingLog"("userId", "date");

-- CreateIndex
CREATE INDEX "TrainingLog_userId_type_date_idx" ON "TrainingLog"("userId", "type", "date");

-- CreateIndex
CREATE INDEX "DailyCheckIn_userId_date_idx" ON "DailyCheckIn"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyCheckIn_userId_date_key" ON "DailyCheckIn"("userId", "date");

-- CreateIndex
CREATE INDEX "FatigueScore_userId_date_idx" ON "FatigueScore"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FatigueScore_userId_date_key" ON "FatigueScore"("userId", "date");
