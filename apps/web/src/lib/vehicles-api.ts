import { apiFetch } from '@/lib/api';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  Vehicle,
  VehicleStatus,
} from '@/types/vehicle';

export type VehicleFilters = {
  search?: string;
  status?: VehicleStatus;
  shipmentId?: string;
};

function buildQueryString(filters: VehicleFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.search?.trim()) {
    searchParams.set('search', filters.search.trim());
  }

  if (filters.status) {
    searchParams.set('status', filters.status);
  }

  if (filters.shipmentId) {
    searchParams.set('shipmentId', filters.shipmentId);
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : '';
}

export function getVehicles(
  filters: VehicleFilters = {},
): Promise<Vehicle[]> {
  return apiFetch<Vehicle[]>(
    `/vehicles${buildQueryString(filters)}`,
  );
}

export function getVehicle(id: string): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/vehicles/${id}`);
}

export function createVehicle(
  input: CreateVehicleInput,
): Promise<Vehicle> {
  return apiFetch<Vehicle>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateVehicle(
  id: string,
  input: UpdateVehicleInput,
): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/vehicles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteVehicle(id: string): Promise<Vehicle> {
  return apiFetch<Vehicle>(`/vehicles/${id}`, {
    method: 'DELETE',
  });
}

