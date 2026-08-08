import { ShipmentStatus } from '../../generated/prisma/enums';

import {
  getAllowedShipmentTransitions,
  isShipmentTerminalStatus,
  isShipmentTransitionAllowed,
  SHIPMENT_WORKFLOW_TRANSITIONS,
} from './shipment-workflow';

describe('Shipment workflow state machine', () => {
  describe('allowed transitions', () => {
    it.each([
      [ShipmentStatus.DRAFT, ShipmentStatus.QUOTED],
      [ShipmentStatus.QUOTED, ShipmentStatus.BOOKED],
      [ShipmentStatus.BOOKED, ShipmentStatus.RECEIVED],
      [ShipmentStatus.RECEIVED, ShipmentStatus.LOADED],
      [ShipmentStatus.LOADED, ShipmentStatus.IN_TRANSIT],
      [ShipmentStatus.IN_TRANSIT, ShipmentStatus.ARRIVED],
      [ShipmentStatus.ARRIVED, ShipmentStatus.CUSTOMS_CLEARANCE],
      [ShipmentStatus.CUSTOMS_CLEARANCE, ShipmentStatus.READY_FOR_DELIVERY],
      [ShipmentStatus.READY_FOR_DELIVERY, ShipmentStatus.DELIVERED],
    ])('allows %s -> %s', (currentStatus, targetStatus) => {
      expect(isShipmentTransitionAllowed(currentStatus, targetStatus)).toBe(
        true,
      );
    });
  });

  describe('illegal transitions', () => {
    it.each([
      [ShipmentStatus.DRAFT, ShipmentStatus.BOOKED],
      [ShipmentStatus.DRAFT, ShipmentStatus.LOADED],
      [ShipmentStatus.DRAFT, ShipmentStatus.IN_TRANSIT],
      [ShipmentStatus.QUOTED, ShipmentStatus.RECEIVED],
      [ShipmentStatus.BOOKED, ShipmentStatus.LOADED],
      [ShipmentStatus.RECEIVED, ShipmentStatus.IN_TRANSIT],
      [ShipmentStatus.LOADED, ShipmentStatus.LOADED],
      [ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELIVERED],
      [ShipmentStatus.ARRIVED, ShipmentStatus.READY_FOR_DELIVERY],
      [ShipmentStatus.CUSTOMS_CLEARANCE, ShipmentStatus.DELIVERED],
      [ShipmentStatus.DELIVERED, ShipmentStatus.READY_FOR_DELIVERY],
    ])('rejects %s -> %s', (currentStatus, targetStatus) => {
      expect(isShipmentTransitionAllowed(currentStatus, targetStatus)).toBe(
        false,
      );
    });
  });

  it.each([
    [ShipmentStatus.DRAFT, ShipmentStatus.QUOTED],
    [ShipmentStatus.QUOTED, ShipmentStatus.BOOKED],
    [ShipmentStatus.BOOKED, ShipmentStatus.RECEIVED],
    [ShipmentStatus.RECEIVED, ShipmentStatus.LOADED],
    [ShipmentStatus.LOADED, ShipmentStatus.IN_TRANSIT],
    [ShipmentStatus.IN_TRANSIT, ShipmentStatus.ARRIVED],
    [ShipmentStatus.ARRIVED, ShipmentStatus.CUSTOMS_CLEARANCE],
    [ShipmentStatus.CUSTOMS_CLEARANCE, ShipmentStatus.READY_FOR_DELIVERY],
    [ShipmentStatus.READY_FOR_DELIVERY, ShipmentStatus.DELIVERED],
  ])('returns exactly %s -> %s', (currentStatus, targetStatus) => {
    expect(getAllowedShipmentTransitions(currentStatus)).toEqual([
      targetStatus,
    ]);
  });

  it('treats DELIVERED as terminal', () => {
    expect(isShipmentTerminalStatus(ShipmentStatus.DELIVERED)).toBe(true);

    expect(getAllowedShipmentTransitions(ShipmentStatus.DELIVERED)).toEqual([]);
  });

  it('does not treat RECEIVED as terminal', () => {
    expect(isShipmentTerminalStatus(ShipmentStatus.RECEIVED)).toBe(false);
  });

  it('leaves CANCELLED undefined until cancellation rules are defined', () => {
    expect(
      SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.CANCELLED],
    ).toBeUndefined();
  });
});
