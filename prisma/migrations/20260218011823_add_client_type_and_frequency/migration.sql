-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "document" TEXT,
    "birthDate" DATETIME,
    "notes" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "footage" TEXT,
    "accessInfo" TEXT,
    "tenantId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'PERSONAL',
    "frequency" TEXT NOT NULL DEFAULT 'ONE_TIME',
    "frequencyDetails" TEXT,
    CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("accessInfo", "active", "address", "bathrooms", "bedrooms", "birthDate", "document", "footage", "id", "latitude", "longitude", "notes", "phone", "tenantId", "userId") SELECT "accessInfo", "active", "address", "bathrooms", "bedrooms", "birthDate", "document", "footage", "id", "latitude", "longitude", "notes", "phone", "tenantId", "userId" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
