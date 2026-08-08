import { ShipmentStatus } from '../../generated/prisma/enums';

import { SHIPMENT_WORKFLOW_TRANSITIONS } from './shipment-workflow';

describe('Shipment status workflow coverage', () => {
  const operationalStatuses = new Set<ShipmentStatus>([
    ShipmentStatus.DRAFT,
    ShipmentStatus.LOADED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.ARRIVED,
    ShipmentStatus.CUSTOMS_CLEARANCE,
    ShipmentStatus.READY_FOR_DELIVERY,
    ShipmentStatus.DELIVERED,
  ]);

  const pendingBusinessDefinition = new Set<ShipmentStatus>([
    ShipmentStatus.QUOTED,
    ShipmentStatus.BOOKED,
    ShipmentStatus.RECEIVED,
    ShipmentStatus.CANCELLED,
  ]);

  it('classifies every ShipmentStatus enum value', () => {
    const enumStatuses = Object.values(ShipmentStatus);

    const classified = new Set([
      ...operationalStatuses,
      ...pendingBusinessDefinition,
    ]);

    expect(classified.size).toBe(enumStatuses.length);

    expect([...enumStatuses].every((status) => classified.has(status))).toBe(
      true,
    );
  });

  it('keeps pre-operational statuses out of the enforced workflow until their business rules are defined', () => {
    for (const status of pendingBusinessDefinition) {
      expect(SHIPMENT_WORKFLOW_TRANSITIONS[status]).toBeUndefined();
    }
  });

  it('keeps the operational state machine explicit', () => {
    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.DRAFT]).toEqual([
      ShipmentStatus.LOADED,
    ]);

    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.DELIVERED]).toEqual([]);
  });
});
