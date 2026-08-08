import { BadRequestException } from '@nestjs/common';

import {
  ShipmentStatus,
  TrackingEventType,
} from '../../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';
import { TrackingService } from '../tracking/tracking.service';

describe('Tracking API workflow protection', () => {
  let service: TrackingService;

  const shipmentFindUnique = jest.fn();

  const trackingCreate = jest.fn();

  const trackingFindUnique = jest.fn();

  const trackingUpdate = jest.fn();

  const trackingDelete = jest.fn();

  const prismaMock = {
    shipment: {
      findUnique: shipmentFindUnique,
    },

    shipmentTracking: {
      create: trackingCreate,

      findUnique: trackingFindUnique,

      update: trackingUpdate,

      delete: trackingDelete,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new TrackingService(prismaMock as unknown as PrismaService);
  });

  it('allows a normal tracking event without workflow status', async () => {
    shipmentFindUnique.mockResolvedValue({
      id: 'shipment-001',
    });

    trackingCreate.mockResolvedValue({
      id: 'tracking-001',
      shipmentId: 'shipment-001',
      eventType: TrackingEventType.NOTE_ADDED,
      status: null,
      title: 'Operations note',
    });

    const result = await service.create({
      shipmentId: 'shipment-001',
      eventType: TrackingEventType.NOTE_ADDED,
      title: 'Operations note',
      description: 'Container checked.',
    });

    expect(trackingCreate).toHaveBeenCalledTimes(1);

    expect(result.id).toBe('tracking-001');
  });

  it('rejects STATUS_CHANGED creation through generic tracking API', async () => {
    shipmentFindUnique.mockResolvedValue({
      id: 'shipment-001',
    });

    await expect(
      service.create({
        shipmentId: 'shipment-001',
        eventType: TrackingEventType.STATUS_CHANGED,
        status: ShipmentStatus.DELIVERED,
        title: 'Fake delivery',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(trackingCreate).not.toHaveBeenCalled();
  });

  it('rejects a status field even on a non-status tracking event', async () => {
    shipmentFindUnique.mockResolvedValue({
      id: 'shipment-001',
    });

    await expect(
      service.create({
        shipmentId: 'shipment-001',
        eventType: TrackingEventType.NOTE_ADDED,
        status: ShipmentStatus.CANCELLED,
        title: 'Invalid status payload',
      }),
    ).rejects.toThrow(/dedicated shipment workflow endpoints/);

    expect(trackingCreate).not.toHaveBeenCalled();
  });

  it('allows editing a normal tracking event', async () => {
    trackingFindUnique.mockResolvedValue({
      id: 'tracking-001',
      shipmentId: 'shipment-001',
      eventType: TrackingEventType.NOTE_ADDED,
      status: null,
      shipment: {
        id: 'shipment-001',
        shipmentNo: 'EAC-TRACK-001',
        status: ShipmentStatus.DRAFT,
      },
    });

    trackingUpdate.mockResolvedValue({
      id: 'tracking-001',
      title: 'Updated note',
    });

    await service.update('tracking-001', {
      title: 'Updated note',
    });

    expect(trackingUpdate).toHaveBeenCalledTimes(1);
  });

  it('rejects adding shipment status while editing a normal tracking event', async () => {
    trackingFindUnique.mockResolvedValue({
      id: 'tracking-001',
      shipmentId: 'shipment-001',
      eventType: TrackingEventType.NOTE_ADDED,
      status: null,
      shipment: {
        id: 'shipment-001',
        shipmentNo: 'EAC-TRACK-001',
        status: ShipmentStatus.DRAFT,
      },
    });

    await expect(
      service.update('tracking-001', {
        status: ShipmentStatus.DELIVERED,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(trackingUpdate).not.toHaveBeenCalled();
  });

  it('rejects editing workflow-generated STATUS_CHANGED events', async () => {
    trackingFindUnique.mockResolvedValue({
      id: 'tracking-status-001',
      shipmentId: 'shipment-001',
      eventType: TrackingEventType.STATUS_CHANGED,
      status: ShipmentStatus.ARRIVED,
      shipment: {
        id: 'shipment-001',
        shipmentNo: 'EAC-TRACK-001',
        status: ShipmentStatus.ARRIVED,
      },
    });

    await expect(
      service.update('tracking-status-001', {
        title: 'Tampered title',
      }),
    ).rejects.toThrow(/cannot be edited/);

    expect(trackingUpdate).not.toHaveBeenCalled();
  });

  it('rejects deleting workflow-generated STATUS_CHANGED events', async () => {
    trackingFindUnique.mockResolvedValue({
      id: 'tracking-status-001',
      shipmentId: 'shipment-001',
      eventType: TrackingEventType.STATUS_CHANGED,
      status: ShipmentStatus.ARRIVED,
      shipment: {
        id: 'shipment-001',
        shipmentNo: 'EAC-TRACK-001',
        status: ShipmentStatus.ARRIVED,
      },
    });

    await expect(service.remove('tracking-status-001')).rejects.toThrow(
      /cannot be deleted/,
    );

    expect(trackingDelete).not.toHaveBeenCalled();
  });
});
