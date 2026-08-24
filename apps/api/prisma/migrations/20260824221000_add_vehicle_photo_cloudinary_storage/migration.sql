ALTER TABLE "VehiclePhoto"
ADD COLUMN "storageProvider" TEXT NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "remoteUrl" TEXT,
ADD COLUMN "remotePublicId" TEXT;
