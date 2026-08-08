import { ShipmentStatus } from '../../generated/prisma/enums';

export const SHIPMENT_WORKFLOW_TRANSITIONS: Readonly<
  Partial<Record<ShipmentStatus, readonly ShipmentStatus[]>>
> = {
  [ShipmentStatus.DRAFT]: [ShipmentStatus.QUOTED, ShipmentStatus.CANCELLED],

  [ShipmentStatus.QUOTED]: [ShipmentStatus.BOOKED, ShipmentStatus.CANCELLED],

  [ShipmentStatus.BOOKED]: [ShipmentStatus.RECEIVED, ShipmentStatus.CANCELLED],

  [ShipmentStatus.RECEIVED]: [ShipmentStatus.LOADED, ShipmentStatus.CANCELLED],

  [ShipmentStatus.LOADED]: [
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.CANCELLED,
  ],

  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.ARRIVED],

  [ShipmentStatus.ARRIVED]: [ShipmentStatus.CUSTOMS_CLEARANCE],

  [ShipmentStatus.CUSTOMS_CLEARANCE]: [ShipmentStatus.READY_FOR_DELIVERY],

  [ShipmentStatus.READY_FOR_DELIVERY]: [ShipmentStatus.DELIVERED],

  [ShipmentStatus.DELIVERED]: [],

  [ShipmentStatus.CANCELLED]: [],
};

export function getAllowedShipmentTransitions(
  currentStatus: ShipmentStatus,
): readonly ShipmentStatus[] {
  return SHIPMENT_WORKFLOW_TRANSITIONS[currentStatus] ?? [];
}

export function isShipmentTransitionAllowed(
  currentStatus: ShipmentStatus,
  targetStatus: ShipmentStatus,
): boolean {
  return getAllowedShipmentTransitions(currentStatus).includes(targetStatus);
}

export function isShipmentTerminalStatus(status: ShipmentStatus): boolean {
  return (
    status === ShipmentStatus.DELIVERED || status === ShipmentStatus.CANCELLED
  );
}
