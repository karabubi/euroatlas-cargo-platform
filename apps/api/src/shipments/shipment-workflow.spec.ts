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
      [ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELIVERED],

      [ShipmentStatus.ARRIVED, ShipmentStatus.DELIVERED],

      [ShipmentStatus.ARRIVED, ShipmentStatus.READY_FOR_DELIVERY],

      [ShipmentStatus.CUSTOMS_CLEARANCE, ShipmentStatus.DELIVERED],

      [ShipmentStatus.READY_FOR_DELIVERY, ShipmentStatus.ARRIVED],

      [ShipmentStatus.DELIVERED, ShipmentStatus.READY_FOR_DELIVERY],
    ])('rejects %s -> %s', (currentStatus, targetStatus) => {
      expect(isShipmentTransitionAllowed(currentStatus, targetStatus)).toBe(
        false,
      );
    });
  });

  it('returns exactly ARRIVED after IN_TRANSIT', () => {
    expect(getAllowedShipmentTransitions(ShipmentStatus.IN_TRANSIT)).toEqual([
      ShipmentStatus.ARRIVED,
    ]);
  });

  it('returns exactly CUSTOMS_CLEARANCE after ARRIVED', () => {
    expect(getAllowedShipmentTransitions(ShipmentStatus.ARRIVED)).toEqual([
      ShipmentStatus.CUSTOMS_CLEARANCE,
    ]);
  });

  it('returns exactly READY_FOR_DELIVERY after CUSTOMS_CLEARANCE', () => {
    expect(
      getAllowedShipmentTransitions(ShipmentStatus.CUSTOMS_CLEARANCE),
    ).toEqual([ShipmentStatus.READY_FOR_DELIVERY]);
  });

  it('returns exactly DELIVERED after READY_FOR_DELIVERY', () => {
    expect(
      getAllowedShipmentTransitions(ShipmentStatus.READY_FOR_DELIVERY),
    ).toEqual([ShipmentStatus.DELIVERED]);
  });

  it('treats DELIVERED as terminal', () => {
    expect(isShipmentTerminalStatus(ShipmentStatus.DELIVERED)).toBe(true);

    expect(getAllowedShipmentTransitions(ShipmentStatus.DELIVERED)).toEqual([]);
  });

  it('does not treat an active workflow state as terminal', () => {
    expect(isShipmentTerminalStatus(ShipmentStatus.ARRIVED)).toBe(false);
  });

  it('contains an explicit DELIVERED terminal entry', () => {
    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.DELIVERED]).toEqual([]);
  });
});
