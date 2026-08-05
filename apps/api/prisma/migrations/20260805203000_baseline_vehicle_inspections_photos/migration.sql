-- CreateEnum
CREATE TYPE "VehiclePhotoCategory" AS ENUM ('FRONT', 'REAR', 'LEFT_SIDE', 'RIGHT_SIDE', 'INTERIOR', 'DASHBOARD', 'VIN', 'ENGINE', 'DAMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "InspectionType" AS ENUM ('RECEIVING', 'PRE_LOADING', 'POST_LOADING', 'ARRIVAL', 'CUSTOMS', 'DELIVERY', 'GENERAL');

-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InspectionCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED');

-- CreateEnum
CREATE TYPE "DamageSeverity" AS ENUM ('MINOR', 'MODERATE', 'MAJOR', 'TOTAL_LOSS');

-- CreateEnum
CREATE TYPE "DamageArea" AS ENUM ('FRONT', 'REAR', 'LEFT_SIDE', 'RIGHT_SIDE', 'ROOF', 'UNDERBODY', 'INTERIOR', 'ENGINE', 'GLASS', 'WHEELS', 'OTHER');

-- CreateTable
CREATE TABLE "VehiclePhoto" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "category" "VehiclePhotoCategory" NOT NULL DEFAULT 'OTHER',
    "title" TEXT,
    "description" TEXT,
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehiclePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleInspection" (
    "id" TEXT NOT NULL,
    "inspectionNo" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" "InspectionType" NOT NULL,
    "status" "InspectionStatus" NOT NULL DEFAULT 'DRAFT',
    "condition" "InspectionCondition",
    "inspectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "inspectorName" TEXT,
    "odometer" INTEGER,
    "fuelLevel" INTEGER,
    "hasKeys" BOOLEAN,
    "isRunning" BOOLEAN,
    "hasVisibleDamage" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleInspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDamageReport" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "area" "DamageArea" NOT NULL,
    "severity" "DamageSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedCost" DECIMAL(12,2),
    "requiresRepair" BOOLEAN NOT NULL DEFAULT true,
    "repaired" BOOLEAN NOT NULL DEFAULT false,
    "repairNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleDamageReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehiclePhoto_vehicleId_idx" ON "VehiclePhoto"("vehicleId");

-- CreateIndex
CREATE INDEX "VehiclePhoto_category_idx" ON "VehiclePhoto"("category");

-- CreateIndex
CREATE INDEX "VehiclePhoto_isPrimary_idx" ON "VehiclePhoto"("isPrimary");

-- CreateIndex
CREATE INDEX "VehiclePhoto_createdAt_idx" ON "VehiclePhoto"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleInspection_inspectionNo_key" ON "VehicleInspection"("inspectionNo");

-- CreateIndex
CREATE INDEX "VehicleInspection_vehicleId_idx" ON "VehicleInspection"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleInspection_inspectionNo_idx" ON "VehicleInspection"("inspectionNo");

-- CreateIndex
CREATE INDEX "VehicleInspection_type_idx" ON "VehicleInspection"("type");

-- CreateIndex
CREATE INDEX "VehicleInspection_status_idx" ON "VehicleInspection"("status");

-- CreateIndex
CREATE INDEX "VehicleInspection_inspectionDate_idx" ON "VehicleInspection"("inspectionDate");

-- CreateIndex
CREATE INDEX "VehicleDamageReport_inspectionId_idx" ON "VehicleDamageReport"("inspectionId");

-- CreateIndex
CREATE INDEX "VehicleDamageReport_area_idx" ON "VehicleDamageReport"("area");

-- CreateIndex
CREATE INDEX "VehicleDamageReport_severity_idx" ON "VehicleDamageReport"("severity");

-- CreateIndex
CREATE INDEX "VehicleDamageReport_repaired_idx" ON "VehicleDamageReport"("repaired");

-- AddForeignKey
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInspection" ADD CONSTRAINT "VehicleInspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleDamageReport" ADD CONSTRAINT "VehicleDamageReport_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "VehicleInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
