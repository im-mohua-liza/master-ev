-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "gstin" TEXT,
    "bankDetails" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Supplier" ("address", "bankDetails", "companyName", "contactPerson", "createdAt", "email", "gstin", "id", "isActive", "notes", "phone", "updatedAt") SELECT "address", "bankDetails", "companyName", "contactPerson", "createdAt", "email", "gstin", "id", "isActive", "notes", "phone", "updatedAt" FROM "Supplier";
DROP TABLE "Supplier";
ALTER TABLE "new_Supplier" RENAME TO "Supplier";
CREATE TABLE "new_VehicleModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT,
    "batteryType" TEXT,
    "batteryCapacity" TEXT,
    "motorPower" TEXT,
    "range" TEXT,
    "topSpeed" TEXT,
    "exShowroomPrice" REAL,
    "gstRate" REAL NOT NULL DEFAULT 5,
    "defaultPurchasePrice" REAL,
    "defaultSellingPrice" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_VehicleModel" ("batteryCapacity", "batteryType", "brand", "createdAt", "defaultPurchasePrice", "defaultSellingPrice", "exShowroomPrice", "gstRate", "id", "isActive", "model", "motorPower", "range", "topSpeed", "updatedAt", "variant") SELECT "batteryCapacity", "batteryType", "brand", "createdAt", "defaultPurchasePrice", "defaultSellingPrice", "exShowroomPrice", "gstRate", "id", "isActive", "model", "motorPower", "range", "topSpeed", "updatedAt", "variant" FROM "VehicleModel";
DROP TABLE "VehicleModel";
ALTER TABLE "new_VehicleModel" RENAME TO "VehicleModel";
CREATE UNIQUE INDEX "VehicleModel_brand_model_variant_key" ON "VehicleModel"("brand", "model", "variant");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
