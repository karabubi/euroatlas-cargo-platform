import { apiFetch } from "@/lib/api";
import type { Shipment, ShipmentStatus } from "@/types/shipment";

export type ShipmentFilters = {
  search?: string;
  status?: ShipmentStatus;
};

function buildQueryString(filters: ShipmentFilters): string {
  const searchParams = new URLSearchParams();

  if (filters.search?.trim()) {
    searchParams.set("search", filters.search.trim());
  }

  if (filters.status) {
    searchParams.set("status", filters.status);
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

export function getShipments(
  filters: ShipmentFilters = {},
): Promise<Shipment[]> {
  return apiFetch<Shipment[]>(`/shipments${buildQueryString(filters)}`);
}

export function getShipment(id: string): Promise<Shipment> {
  return apiFetch<Shipment>(`/shipments/${id}`);
}

export function dispatchShipment(
  shipmentId: string,
  input: import("@/types/shipment").DispatchShipmentInput,
): Promise<import("@/types/shipment").DispatchShipmentResponse> {
  return apiFetch<import("@/types/shipment").DispatchShipmentResponse>(
    `/shipments/${shipmentId}/dispatch`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function markShipmentArrived(
  shipmentId: string,
  input: import("@/types/shipment").ArrivalShipmentInput,
): Promise<import("@/types/shipment").ArrivalShipmentResponse> {
  return apiFetch<import("@/types/shipment").ArrivalShipmentResponse>(
    `/shipments/${shipmentId}/arrival`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function startShipmentCustomsClearance(
  shipmentId: string,
  input: import("@/types/shipment").CustomsClearanceShipmentInput,
): Promise<import("@/types/shipment").CustomsClearanceShipmentResponse> {
  return apiFetch<import("@/types/shipment").CustomsClearanceShipmentResponse>(
    `/shipments/${shipmentId}/customs-clearance`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function markShipmentReadyForDelivery(
  shipmentId: string,
  input: import("@/types/shipment").ReadyForDeliveryShipmentInput,
): Promise<import("@/types/shipment").ReadyForDeliveryShipmentResponse> {
  return apiFetch<import("@/types/shipment").ReadyForDeliveryShipmentResponse>(
    `/shipments/${shipmentId}/ready-for-delivery`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function deliverShipment(
  shipmentId: string,
  input: import("@/types/shipment").DeliverShipmentInput,
): Promise<import("@/types/shipment").DeliverShipmentResponse> {
  return apiFetch<import("@/types/shipment").DeliverShipmentResponse>(
    `/shipments/${shipmentId}/delivery`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function cancelShipment(
  shipmentId: string,
  input: import("@/types/shipment").CancelShipmentInput,
): Promise<import("@/types/shipment").CancelShipmentResponse> {
  return apiFetch<import("@/types/shipment").CancelShipmentResponse>(
    `/shipments/${shipmentId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
