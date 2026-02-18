-- CreateTable
CREATE TABLE "SchedulingConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "availability" TEXT NOT NULL DEFAULT '{}',
    "holidays" TEXT NOT NULL DEFAULT '[]',
    "rateNormal" DECIMAL NOT NULL DEFAULT 50.00,
    "rateNormal2" DECIMAL NOT NULL DEFAULT 75.00,
    "rateUrgent" DECIMAL NOT NULL DEFAULT 100.00,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SchedulingConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SchedulingConfig_tenantId_key" ON "SchedulingConfig"("tenantId");
