import { ShipmentStatus } from '../../generated/prisma/enums';

import {
  getAllowedShipmentTransitions,
  isShipmentTerminalStatus,
  isShipmentTransitionAllowed,
  SHIPMENT_WORKFLOW_TRANSITIONS,
} from './shipment-workflow';

describe('Shipment workflow state machine', () => {
  describe('allowed primary transitions', () => {
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

  describe('allowed cancellation transitions', () => {
    it.each([
      ShipmentStatus.DRAFT,
      ShipmentStatus.QUOTED,
      ShipmentStatus.BOOKED,
      ShipmentStatus.RECEIVED,
      ShipmentStatus.LOADED,
    ])('allows %s -> CANCELLED', (status) => {
      expect(
        isShipmentTransitionAllowed(status, ShipmentStatus.CANCELLED),
      ).toBe(true);
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

  describe('late cancellation rejection', () => {
    it.each([
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.ARRIVED,
      ShipmentStatus.CUSTOMS_CLEARANCE,
      ShipmentStatus.READY_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ])('rejects %s -> CANCELLED', (status) => {
      expect(
        isShipmentTransitionAllowed(status, ShipmentStatus.CANCELLED),
      ).toBe(false);
    });
  });

  it('returns QUOTED and CANCELLED after DRAFT', () => {
    expect(getAllowedShipmentTransitions(ShipmentStatus.DRAFT)).toEqual([
      ShipmentStatus.QUOTED,
      ShipmentStatus.CANCELLED,
    ]);
  });

  it('returns BOOKED and CANCELLED after QUOTED', () => {
    expect(getAllowedShipmentTransitions(ShipmentStatus.QUOTED)).toEqual([
      ShipmentStatus.BOOKED,
      ShipmentStatus.CANCELLED,
    ]);
  });

  it('returns RECEIVED and CANCELLED after BOOKED', () => {
    expect(getAllowedShipmentTransitions(ShipmentStatus.BOOKED)).toEqual([
      ShipmentStatus.RECEIVED,
      ShipmentStatus.CANCELLED,
    ]);
  });

  it('returns LOADED and CANCELLED after RECEIVED', () => {
    expect(getAllowedShipmentTransitions(ShipmentStatus.RECEIVED)).toEqual([
      ShipmentStatus.LOADED,
      ShipmentStatus.CANCELLED,
    ]);
  });

  it('returns IN_TRANSIT and CANCELLED after LOADED', () => {
    expect(getAllowedShipmentTransitions(ShipmentStatus.LOADED)).toEqual([
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.CANCELLED,
    ]);
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

  it('treats CANCELLED as terminal', () => {
    expect(isShipmentTerminalStatus(ShipmentStatus.CANCELLED)).toBe(true);

    expect(getAllowedShipmentTransitions(ShipmentStatus.CANCELLED)).toEqual([]);
  });

  it('does not treat RECEIVED as terminal', () => {
    expect(isShipmentTerminalStatus(ShipmentStatus.RECEIVED)).toBe(false);
  });

  it('contains explicit terminal entries', () => {
    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.DELIVERED]).toEqual([]);

    expect(SHIPMENT_WORKFLOW_TRANSITIONS[ShipmentStatus.CANCELLED]).toEqual([]);
  });
});
