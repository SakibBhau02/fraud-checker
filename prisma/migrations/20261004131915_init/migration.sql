-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckHistory" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL,
    "delivered" INTEGER NOT NULL,
    "cancelled" INTEGER NOT NULL,
    "successRate" DOUBLE PRECISION NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "courierBreakdown" JSONB NOT NULL,
    "rawJson" JSONB NOT NULL,
    "checkedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CheckHistory_phone_createdAt_idx" ON "CheckHistory"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "CheckHistory_riskLevel_createdAt_idx" ON "CheckHistory"("riskLevel", "createdAt");

-- AddForeignKey
ALTER TABLE "CheckHistory" ADD CONSTRAINT "CheckHistory_checkedByUserId_fkey" FOREIGN KEY ("checkedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
