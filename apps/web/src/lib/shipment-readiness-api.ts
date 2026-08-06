import { apiFetch } from "@/lib/api";
import type { ShipmentReadinessResponse } from "@/types/shipment-readiness";

export function getShipmentReadiness(
  shipmentId: string,
): Promise<ShipmentReadinessResponse> {
  return apiFetch<ShipmentReadinessResponse>(
    `/shipments/${shipmentId}/readiness`,
  );
}
