-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "address" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "actualStartTime" DATETIME,
    "actualEndTime" DATETIME,
    "clientConfirmationDate" DATETIME,
    "invoiceId" TEXT,
    "customerId" TEXT NOT NULL,
    "employeeId" TEXT,
    "serviceId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Appointment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("actualEndTime", "actualStartTime", "address", "clientConfirmationDate", "createdAt", "customerId", "employeeId", "endTime", "id", "invoiceId", "notes", "price", "serviceId", "startTime", "status", "tenantId", "updatedAt") SELECT "actualEndTime", "actualStartTime", "address", "clientConfirmationDate", "createdAt", "customerId", "employeeId", "endTime", "id", "invoiceId", "notes", "price", "serviceId", "startTime", "status", "tenantId", "updatedAt" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
