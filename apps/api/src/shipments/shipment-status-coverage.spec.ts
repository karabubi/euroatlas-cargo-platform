import { ShipmentStatus } from '../../generated/prisma/enums';

import { SHIPMENT_WORKFLOW_TRANSITIONS } from './shipment-workflow';

describe('Shipment status workflow coverage', () => {
  it('defines every ShipmentStatus enum value in the workflow map', () => {
    const enumStatuses = Object.values(ShipmentStatus);

    for (const status of enumStatuses) {
      expect(SHIPMENT_WORKFLOW_TRANSITIONS[status]).toBeDefined();
    }
  });

  it('defines the pre-operational lifecycle', () => {
    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.DRAFT]).toContain(
      ShipmentStatus.QUOTED,
    );

    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.QUOTED]).toContain(
      ShipmentStatus.BOOKED,
    );

    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.BOOKED]).toContain(
      ShipmentStatus.RECEIVED,
    );

    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.RECEIVED]).toContain(
      ShipmentStatus.LOADED,
    );
  });

  it('allows cancellation only before departure', () => {
    for (const status of [
      ShipmentStatus.DRAFT,
      ShipmentStatus.QUOTED,
      ShipmentStatus.BOOKED,
      ShipmentStatus.RECEIVED,
      ShipmentStatus.LOADED,
    ]) {
      expect(SHIPMENT_WORKFLOW_TRANSITIONS[status]).toContain(
        ShipmentStatus.CANCELLED,
      );
    }

    for (const status of [
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.ARRIVED,
      ShipmentStatus.CUSTOMS_CLEARANCE,
      ShipmentStatus.READY_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ]) {
      expect(SHIPMENT_WORKFLOW_TRANSITIONS[status]).not.toContain(
        ShipmentStatus.CANCELLED,
      );
    }
  });

  it('keeps both DELIVERED and CANCELLED terminal', () => {
    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.DELIVERED]).toEqual([]);

    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.CANCELLED]).toEqual([]);
  });
});
