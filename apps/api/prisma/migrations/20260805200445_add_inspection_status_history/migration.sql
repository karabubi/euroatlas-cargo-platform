-- CreateTable
CREATE TABLE "InspectionStatusHistory" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "fromStatus" "InspectionStatus",
    "toStatus" "InspectionStatus" NOT NULL,
    "note" TEXT,
    "changedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InspectionStatusHistory_inspectionId_idx" ON "InspectionStatusHistory"("inspectionId");

-- CreateIndex
CREATE INDEX "InspectionStatusHistory_toStatus_idx" ON "InspectionStatusHistory"("toStatus");

-- CreateIndex
CREATE INDEX "InspectionStatusHistory_createdAt_idx" ON "InspectionStatusHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "InspectionStatusHistory" ADD CONSTRAINT "InspectionStatusHistory_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "VehicleInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
