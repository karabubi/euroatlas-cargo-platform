export type InspectionType =
  | "RECEIVING"
  | "PRE_LOADING"
  | "POST_LOADING"
  | "ARRIVAL"
  | "CUSTOMS"
  | "DELIVERY"
  | "GENERAL";

export type InspectionStatus =
  "DRAFT" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type InspectionApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type InspectionApprovalHistory = {
  id: string;
  inspectionId: string;
  fromStatus: InspectionApprovalStatus | null;
  toStatus: InspectionApprovalStatus;
  note: string | null;
  changedBy: string;
  changedByName: string | null;
  createdAt: string;
};

export type InspectionApprovalActionInput = {
  note?: string;
};

export type InspectionCondition =
  "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "DAMAGED";

export type DamageSeverity = "MINOR" | "MODERATE" | "MAJOR" | "TOTAL_LOSS";

export type DamageArea =
  | "FRONT"
  | "REAR"
  | "LEFT_SIDE"
  | "RIGHT_SIDE"
  | "ROOF"
  | "UNDERBODY"
  | "INTERIOR"
  | "ENGINE"
  | "GLASS"
  | "WHEELS"
  | "OTHER";

export type VehicleDamageReport = {
  id: string;
  inspectionId: string;
  area: DamageArea;
  severity: DamageSeverity;
  title: string;
  description: string | null;
  estimatedCost: string | number | null;
  requiresRepair: boolean;
  repaired: boolean;
  repairNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InspectionVehicle = {
  id: string;
  vehicleNo: string;
  vin: string | null;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  status: string;
  shipment: {
    id: string;
    shipmentNo: string;
    originCountry: string;
    destinationCountry: string;
  };
};

export type InspectionStatusHistory = {
  id: string;
  inspectionId: string;
  fromStatus: InspectionStatus | null;
  toStatus: InspectionStatus;
  note: string | null;
  changedBy: string | null;
  createdAt: string;
};

export type ChangeInspectionStatusInput = {
  status: InspectionStatus;
  note?: string;
};

export type VehicleInspection = {
  id: string;
  inspectionNo: string;
  vehicleId: string;
  type: InspectionType;
  status: InspectionStatus;
  approvalStatus: InspectionApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  approvalNote: string | null;
  condition: InspectionCondition | null;
  inspectionDate: string;
  location: string | null;
  inspectorName: string | null;
  odometer: number | null;
  fuelLevel: number | null;
  hasKeys: boolean | null;
  isRunning: boolean | null;
  hasVisibleDamage: boolean;
  summary: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: InspectionVehicle;
  damageReports: VehicleDamageReport[];
  statusHistory: InspectionStatusHistory[];
  approvalHistory: InspectionApprovalHistory[];
  _count?: {
    damageReports: number;
  };
};

export type CreateVehicleInspectionInput = {
  vehicleId: string;
  type: InspectionType;
  status?: InspectionStatus;
  condition?: InspectionCondition;
  inspectionDate?: string;
  location?: string;
  inspectorName?: string;
  odometer?: number;
  fuelLevel?: number;
  hasKeys?: boolean;
  isRunning?: boolean;
  hasVisibleDamage?: boolean;
  summary?: string;
  notes?: string;
};

export type UpdateVehicleInspectionInput =
  Partial<CreateVehicleInspectionInput>;

export type CreateDamageReportInput = {
  area: DamageArea;
  severity: DamageSeverity;
  title: string;
  description?: string;
  estimatedCost?: number;
  requiresRepair?: boolean;
  repaired?: boolean;
  repairNotes?: string;
};

export type UpdateDamageReportInput = Partial<CreateDamageReportInput>;

export const inspectionTypeOptions: {
  value: InspectionType;
  label: string;
}[] = [
  { value: "RECEIVING", label: "Receiving" },
  { value: "PRE_LOADING", label: "Pre-loading" },
  { value: "POST_LOADING", label: "Post-loading" },
  { value: "ARRIVAL", label: "Arrival" },
  { value: "CUSTOMS", label: "Customs" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "GENERAL", label: "General" },
];

export const inspectionStatusOptions: {
  value: InspectionStatus;
  label: string;
}[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const inspectionConditionOptions: {
  value: InspectionCondition;
  label: string;
}[] = [
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
  { value: "DAMAGED", label: "Damaged" },
];

export const damageSeverityOptions: {
  value: DamageSeverity;
  label: string;
}[] = [
  { value: "MINOR", label: "Minor" },
  { value: "MODERATE", label: "Moderate" },
  { value: "MAJOR", label: "Major" },
  { value: "TOTAL_LOSS", label: "Total loss" },
];

export const damageAreaOptions: {
  value: DamageArea;
  label: string;
}[] = [
  { value: "FRONT", label: "Front" },
  { value: "REAR", label: "Rear" },
  { value: "LEFT_SIDE", label: "Left side" },
  { value: "RIGHT_SIDE", label: "Right side" },
  { value: "ROOF", label: "Roof" },
  { value: "UNDERBODY", label: "Underbody" },
  { value: "INTERIOR", label: "Interior" },
  { value: "ENGINE", label: "Engine" },
  { value: "GLASS", label: "Glass" },
  { value: "WHEELS", label: "Wheels" },
  { value: "OTHER", label: "Other" },
];

export function formatInspectionValue(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export type VehicleInspectionDashboardQuery = {
  search?: string;
  type?: InspectionType;
  status?: InspectionStatus;
  condition?: InspectionCondition;
  damageSeverity?: DamageSeverity;
  hasVisibleDamage?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

export type VehicleInspectionPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type VehicleInspectionStatistics = {
  total: number;
  completed: number;
  inProgress: number;
  withDamage: number;
  totalDamageReports: number;
};

export type VehicleInspectionDashboardResponse = {
  data: VehicleInspection[];
  pagination: VehicleInspectionPagination;
  statistics: VehicleInspectionStatistics;
};
