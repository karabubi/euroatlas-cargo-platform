-- CreateEnum
CREATE TYPE "TrackingEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'LOCATION_UPDATE', 'DOCUMENT_UPLOADED', 'NOTE_ADDED');

-- CreateTable
CREATE TABLE "ShipmentTracking" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "eventType" "TrackingEventType" NOT NULL,
    "status" "ShipmentStatus",
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShipmentTracking_shipmentId_idx" ON "ShipmentTracking"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentTracking_eventType_idx" ON "ShipmentTracking"("eventType");

-- CreateIndex
CREATE INDEX "ShipmentTracking_createdAt_idx" ON "ShipmentTracking"("createdAt");

-- AddForeignKey
ALTER TABLE "ShipmentTracking" ADD CONSTRAINT "ShipmentTracking_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
