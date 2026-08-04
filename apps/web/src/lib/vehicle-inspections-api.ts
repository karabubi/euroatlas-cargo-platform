import { apiFetch } from '@/lib/api';
import type {
  CreateDamageReportInput,
  CreateVehicleInspectionInput,
  UpdateDamageReportInput,
  UpdateVehicleInspectionInput,
  VehicleDamageReport,
  VehicleInspection,
} from '@/types/vehicle-inspection';

export function getVehicleInspections(
  vehicleId: string,
): Promise<VehicleInspection[]> {
  return apiFetch<VehicleInspection[]>(
    `/vehicle-inspections/vehicle/${vehicleId}`,
  );
}

export function getAllVehicleInspections():
  Promise<VehicleInspection[]> {
  return apiFetch<VehicleInspection[]>(
    '/vehicle-inspections',
  );
}

export function getVehicleInspection(
  inspectionId: string,
): Promise<VehicleInspection> {
  return apiFetch<VehicleInspection>(
    `/vehicle-inspections/${inspectionId}`,
  );
}

export function createVehicleInspection(
  input: CreateVehicleInspectionInput,
): Promise<VehicleInspection> {
  return apiFetch<VehicleInspection>(
    '/vehicle-inspections',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function updateVehicleInspection(
  inspectionId: string,
  input: UpdateVehicleInspectionInput,
): Promise<VehicleInspection> {
  return apiFetch<VehicleInspection>(
    `/vehicle-inspections/${inspectionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export function deleteVehicleInspection(
  inspectionId: string,
): Promise<{
  message: string;
  id: string;
  inspectionNo: string;
}> {
  return apiFetch<{
    message: string;
    id: string;
    inspectionNo: string;
  }>(`/vehicle-inspections/${inspectionId}`, {
    method: 'DELETE',
  });
}

export function createDamageReport(
  inspectionId: string,
  input: CreateDamageReportInput,
): Promise<VehicleDamageReport> {
  return apiFetch<VehicleDamageReport>(
    `/vehicle-inspections/${inspectionId}/damage-reports`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export function updateDamageReport(
  reportId: string,
  input: UpdateDamageReportInput,
): Promise<VehicleDamageReport> {
  return apiFetch<VehicleDamageReport>(
    `/vehicle-inspections/damage-reports/${reportId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export function deleteDamageReport(
  reportId: string,
): Promise<{
  message: string;
  id: string;
}> {
  return apiFetch<{
    message: string;
    id: string;
  }>(
    `/vehicle-inspections/damage-reports/${reportId}`,
    {
      method: 'DELETE',
    },
  );
}
