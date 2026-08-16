-- CreateEnum
CREATE TYPE "ShipmentNotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "shipment_notification_history" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "channel" "ShipmentNotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL DEFAULT 'TRACKING',
    "shipmentStatus" "ShipmentStatus" NOT NULL,
    "deliveryStatus" "NotificationDeliveryStatus" NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_notification_history_pkey"
    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shipment_notification_history_shipmentId_idx"
ON "shipment_notification_history"("shipmentId");

-- CreateIndex
CREATE INDEX "shipment_notification_history_channel_idx"
ON "shipment_notification_history"("channel");

-- CreateIndex
CREATE INDEX "shipment_notification_history_deliveryStatus_idx"
ON "shipment_notification_history"("deliveryStatus");

-- CreateIndex
CREATE INDEX "shipment_notification_history_createdAt_idx"
ON "shipment_notification_history"("createdAt");

-- AddForeignKey
ALTER TABLE "shipment_notification_history"
ADD CONSTRAINT "shipment_notification_history_shipmentId_fkey"
FOREIGN KEY ("shipmentId")
REFERENCES "Shipment"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
