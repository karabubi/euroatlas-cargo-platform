export type ShipmentReadinessCheck = {
  key: string;
  label: string;
  passed: boolean;
  blocking: boolean;
  message: string;
};

export type ShipmentReadinessIssue = {
  key: string;
  label: string;
  message: string;
};

export type ShipmentReadinessVehicle = {
  id: string;
  vehicleNo: string;
  make: string;
  model: string;
  status: string;
  inspectionCount: number;

  latestInspection: {
    id: string;
    inspectionNo: string;
    status: string;
    approvalStatus: string;
    inspectionDate: string;
  } | null;

  approvedInspection: {
    id: string;
    inspectionNo: string;
    inspectionDate: string;
    approvedBy: string | null;
    approvedAt: string | null;
  } | null;

  hasApprovedInspection: boolean;
  unresolvedCriticalDamageCount: number;

  unresolvedCriticalDamage: {
    id: string;
    title: string;
    area: string;
    severity: string;
    requiresRepair: boolean;
    repaired: boolean;
  }[];
};

export type ShipmentReadinessDocument = {
  id: string;
  category: string;
  title: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
};

export type ShipmentReadinessResponse = {
  shipment: {
    id: string;
    shipmentNo: string;
    status: string;
    isActive: boolean;
    originCountry: string;
    destinationCountry: string;
  };

  isReady: boolean;
  readinessPercentage: number;

  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    blockerCount: number;
    warningCount: number;
    vehicleCount: number;
    documentCount: number;
    approvedVehicleCount: number;
    vehiclesRequiringInspection: number;
    vehiclesWithCriticalDamage: number;
  };

  checks: ShipmentReadinessCheck[];
  blockers: ShipmentReadinessIssue[];
  warnings: ShipmentReadinessIssue[];
  vehicles: ShipmentReadinessVehicle[];
  documents: ShipmentReadinessDocument[];
  evaluatedAt: string;
};
