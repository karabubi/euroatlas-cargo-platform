import { ShipmentStatus } from '../../generated/prisma/enums';

import { SHIPMENT_WORKFLOW_TRANSITIONS } from './shipment-workflow';

describe('Shipment status workflow coverage', () => {
  const workflowDefinedStatuses = new Set<ShipmentStatus>([
    ShipmentStatus.DRAFT,
    ShipmentStatus.QUOTED,
    ShipmentStatus.BOOKED,
    ShipmentStatus.RECEIVED,
    ShipmentStatus.LOADED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.ARRIVED,
    ShipmentStatus.CUSTOMS_CLEARANCE,
    ShipmentStatus.READY_FOR_DELIVERY,
    ShipmentStatus.DELIVERED,
  ]);

  const pendingBusinessDefinition = new Set<ShipmentStatus>([
    ShipmentStatus.CANCELLED,
  ]);

  it('classifies every ShipmentStatus enum value', () => {
    const enumStatuses = Object.values(ShipmentStatus);

    const classified = new Set([
      ...workflowDefinedStatuses,
      ...pendingBusinessDefinition,
    ]);

    expect(classified.size).toBe(enumStatuses.length);

    expect([...enumStatuses].every((status) => classified.has(status))).toBe(
      true,
    );
  });

  it('keeps only CANCELLED outside the enforced workflow until cancellation rules are defined', () => {
    expect(
      SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.CANCELLED],
    ).toBeUndefined();
  });

  it('defines the complete pre-operational workflow', () => {
    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.DRAFT]).toEqual([
      ShipmentStatus.QUOTED,
    ]);

    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.QUOTED]).toEqual([
      ShipmentStatus.BOOKED,
    ]);

    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.BOOKED]).toEqual([
      ShipmentStatus.RECEIVED,
    ]);

    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.RECEIVED]).toEqual([
      ShipmentStatus.LOADED,
    ]);
  });

  it('keeps DELIVERED terminal', () => {
    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.DELIVERED]).toEqual([]);
  });
});
