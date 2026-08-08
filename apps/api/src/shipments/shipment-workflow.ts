import { ShipmentStatus } from '../../generated/prisma/enums';

export const SHIPMENT_WORKFLOW_TRANSITIONS: Readonly<
  Partial<Record<ShipmentStatus, readonly ShipmentStatus[]>>
> = {
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.ARRIVED],

  [ShipmentStatus.ARRIVED]: [ShipmentStatus.CUSTOMS_CLEARANCE],

  [ShipmentStatus.CUSTOMS_CLEARANCE]: [ShipmentStatus.READY_FOR_DELIVERY],

  [ShipmentStatus.READY_FOR_DELIVERY]: [ShipmentStatus.DELIVERED],

  [ShipmentStatus.DELIVERED]: [],
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
  return status === ShipmentStatus.DELIVERED;
}
