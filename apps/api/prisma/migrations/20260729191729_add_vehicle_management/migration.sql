-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('REGISTERED', 'RECEIVED', 'INSPECTED', 'READY_FOR_LOADING', 'LOADED', 'IN_TRANSIT', 'ARRIVED', 'CUSTOMS_CLEARANCE', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "vin" TEXT,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "color" TEXT,
    "vehicleType" TEXT,
    "fuelType" TEXT,
    "transmission" TEXT,
    "purchasePrice" DECIMAL(12,2),
    "declaredValue" DECIMAL(12,2),
    "hasKeys" BOOLEAN NOT NULL DEFAULT true,
    "isRunning" BOOLEAN NOT NULL DEFAULT true,
    "hasDamage" BOOLEAN NOT NULL DEFAULT false,
    "damageDescription" TEXT,
    "status" "VehicleStatus" NOT NULL DEFAULT 'REGISTERED',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vehicleNo_key" ON "Vehicle"("vehicleNo");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_shipmentId_idx" ON "Vehicle"("shipmentId");

-- CreateIndex
CREATE INDEX "Vehicle_vehicleNo_idx" ON "Vehicle"("vehicleNo");

-- CreateIndex
CREATE INDEX "Vehicle_vin_idx" ON "Vehicle"("vin");

-- CreateIndex
CREATE INDEX "Vehicle_make_idx" ON "Vehicle"("make");

-- CreateIndex
CREATE INDEX "Vehicle_model_idx" ON "Vehicle"("model");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Vehicle_createdAt_idx" ON "Vehicle"("createdAt");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
