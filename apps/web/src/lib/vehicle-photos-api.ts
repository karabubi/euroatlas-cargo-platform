import { apiFetch } from '@/lib/api';
import type {
  UpdateVehiclePhotoInput,
  UploadVehiclePhotoInput,
  VehiclePhoto,
  VehiclePhotoResponse,
} from '@/types/vehicle-photo';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('accessToken');
}

export function getVehiclePhotos(
  vehicleId: string,
): Promise<VehiclePhotoResponse> {
  return apiFetch<VehiclePhotoResponse>(
    `/vehicle-photos/vehicle/${vehicleId}`,
  );
}

export function uploadVehiclePhoto(
  input: UploadVehiclePhotoInput,
): Promise<VehiclePhoto> {
  const formData = new FormData();

  formData.append('file', input.file);
  formData.append('category', input.category);

  if (input.title) {
    formData.append('title', input.title);
  }

  if (input.description) {
    formData.append(
      'description',
      input.description,
    );
  }

  formData.append(
    'isPrimary',
    String(input.isPrimary ?? false),
  );

  formData.append(
    'sortOrder',
    String(input.sortOrder ?? 0),
  );

  return apiFetch<VehiclePhoto>(
    `/vehicle-photos/vehicle/${input.vehicleId}`,
    {
      method: 'POST',
      body: formData,
    },
  );
}

export function updateVehiclePhoto(
  photoId: string,
  input: UpdateVehiclePhotoInput,
): Promise<VehiclePhoto> {
  return apiFetch<VehiclePhoto>(
    `/vehicle-photos/${photoId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export function deleteVehiclePhoto(
  photoId: string,
): Promise<{
  message: string;
  id: string;
}> {
  return apiFetch<{
    message: string;
    id: string;
  }>(`/vehicle-photos/${photoId}`, {
    method: 'DELETE',
  });
}

export function getVehiclePhotoFileUrl(
  photoId: string,
): string {
  return `${API_URL}/vehicle-photos/${photoId}/file`;
}

export async function downloadVehiclePhoto(
  photo: VehiclePhoto,
): Promise<void> {
  const token = getAccessToken();

  const response = await fetch(
    `${API_URL}/vehicle-photos/${photo.id}/download`,
    {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Photo download failed with status ${response.status}.`,
    );
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download =
    photo.originalName || 'vehicle-photo';

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
