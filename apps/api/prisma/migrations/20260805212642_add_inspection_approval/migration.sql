-- CreateEnum
CREATE TYPE "InspectionApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "VehicleInspection" ADD COLUMN     "approvalNote" TEXT,
ADD COLUMN     "approvalStatus" "InspectionApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT;

-- CreateTable
CREATE TABLE "InspectionApprovalHistory" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "fromStatus" "InspectionApprovalStatus",
    "toStatus" "InspectionApprovalStatus" NOT NULL,
    "note" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InspectionApprovalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InspectionApprovalHistory_inspectionId_idx" ON "InspectionApprovalHistory"("inspectionId");

-- CreateIndex
CREATE INDEX "InspectionApprovalHistory_toStatus_idx" ON "InspectionApprovalHistory"("toStatus");

-- CreateIndex
CREATE INDEX "InspectionApprovalHistory_changedBy_idx" ON "InspectionApprovalHistory"("changedBy");

-- CreateIndex
CREATE INDEX "InspectionApprovalHistory_createdAt_idx" ON "InspectionApprovalHistory"("createdAt");

-- CreateIndex
CREATE INDEX "VehicleInspection_approvalStatus_idx" ON "VehicleInspection"("approvalStatus");

-- AddForeignKey
ALTER TABLE "InspectionApprovalHistory" ADD CONSTRAINT "InspectionApprovalHistory_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "VehicleInspection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
