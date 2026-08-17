-- Add nullable columns first so existing production rows remain valid.
ALTER TABLE "shipment_notification_history"
ADD COLUMN "customerId" TEXT,
ADD COLUMN "sentById" TEXT,
ADD COLUMN "sentByEmail" TEXT,
ADD COLUMN "sentByName" TEXT;

-- Every notification history row already belongs to a shipment.
-- Copy the linked shipment customer into the new audit column.
UPDATE "shipment_notification_history" AS history
SET "customerId" = shipment."customerId"
FROM "Shipment" AS shipment
WHERE history."shipmentId" = shipment."id";

-- The backfill makes customerId safe to require for all future rows.
ALTER TABLE "shipment_notification_history"
ALTER COLUMN "customerId" SET NOT NULL;

CREATE INDEX "shipment_notification_history_customerId_idx"
ON "shipment_notification_history"("customerId");

CREATE INDEX "shipment_notification_history_sentById_idx"
ON "shipment_notification_history"("sentById");

ALTER TABLE "shipment_notification_history"
ADD CONSTRAINT "shipment_notification_history_customerId_fkey"
FOREIGN KEY ("customerId")
REFERENCES "Customer"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
