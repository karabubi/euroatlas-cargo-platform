import { apiFetch } from '@/lib/api';
import type {
  CreateTrackingEventInput,
  ShipmentTrackingResponse,
  TrackingEvent,
} from '@/types/tracking';

export async function getShipmentTracking(
  shipmentId: string,
) {
  return apiFetch<ShipmentTrackingResponse>(
    `/tracking/shipment/${shipmentId}`,
  );
}

export async function createTrackingEvent(
  input: CreateTrackingEventInput,
) {
  return apiFetch<TrackingEvent>('/tracking', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
