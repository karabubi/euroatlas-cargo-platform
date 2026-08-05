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

export async function downloadVehicleInspectionPdf(
  inspectionId: string,
  inspectionNo: string,
): Promise<void> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('accessToken') ??
        localStorage.getItem('token') ??
        localStorage.getItem('authToken') ??
        localStorage.getItem('access_token') ??
        localStorage.getItem('euroatlas_access_token')
      : null;

  if (!token) {
    throw new Error('Authentication token was not found.');
  }

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:4000/api';

  const response = await fetch(
    `${apiUrl}/vehicle-inspections/${inspectionId}/pdf`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    let message =
      'Vehicle inspection PDF could not be downloaded.';

    try {
      const body = (await response.json()) as {
        message?: string | string[];
      };

      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${inspectionNo}.pdf`;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(objectUrl);
}

