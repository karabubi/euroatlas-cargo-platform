import type { ShipmentStatus } from "@/types/shipment";

export function formatShipmentStatus(status: ShipmentStatus): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function shipmentStatusBadgeClass(status: ShipmentStatus): string {
  switch (status) {
    case "CANCELLED":
      return "bg-red-100 text-red-800";

    case "DELIVERED":
      return "bg-emerald-100 text-emerald-800";

    case "IN_TRANSIT":
      return "bg-sky-100 text-sky-800";

    case "ARRIVED":
    case "CUSTOMS_CLEARANCE":
    case "READY_FOR_DELIVERY":
      return "bg-amber-100 text-amber-800";

    case "LOADED":
    case "RECEIVED":
      return "bg-violet-100 text-violet-800";

    case "BOOKED":
    case "QUOTED":
      return "bg-blue-100 text-blue-800";

    case "DRAFT":
    default:
      return "bg-slate-100 text-slate-700";
  }
}
