import { ConflictException } from '@nestjs/common';

import { ShipmentStatus } from '../../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';
import { ShipmentsService } from './shipments.service';

describe('Shipment generic update workflow protection', () => {
  let service: ShipmentsService;

  const shipmentFindUnique = jest.fn();
  const shipmentUpdate = jest.fn();

  const prismaMock = {
    shipment: {
      findUnique: shipmentFindUnique,
      update: shipmentUpdate,
    },
  };

  const baseShipment = {
    id: 'generic-update-test-id',
    shipmentNo: 'EAC-UPDATE-001',
    customerId: 'customer-test-id',
    originCountry: 'Germany',
    destinationCountry: 'Libya',
    status: ShipmentStatus.DRAFT,
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ShipmentsService(prismaMock as unknown as PrismaService);

    shipmentUpdate.mockImplementation(({ data }: { data: object }) => ({
      ...baseShipment,
      ...data,
    }));
  });

  it('rejects DRAFT -> LOADED through generic update', async () => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.DRAFT,
    });

    await expect(
      service.update(baseShipment.id, {
        status: ShipmentStatus.LOADED,
      }),
    ).rejects.toThrow(ConflictException);

    expect(shipmentUpdate).not.toHaveBeenCalled();
  });

  it('rejects DRAFT -> DELIVERED even if readiness would otherwise pass', async () => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.DRAFT,
    });

    jest
      .spyOn(
        service as unknown as {
          assertReadyForStatus: (
            id: string,
            status: ShipmentStatus,
          ) => Promise<void>;
        },
        'assertReadyForStatus',
      )
      .mockResolvedValue();

    await expect(
      service.update(baseShipment.id, {
        status: ShipmentStatus.DELIVERED,
      }),
    ).rejects.toThrow(/dedicated workflow endpoints/);

    expect(shipmentUpdate).not.toHaveBeenCalled();
  });

  it('rejects leaving an operational workflow state through generic update', async () => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.ARRIVED,
    });

    await expect(
      service.update(baseShipment.id, {
        status: ShipmentStatus.QUOTED,
      }),
    ).rejects.toThrow(/dedicated workflow endpoints/);

    expect(shipmentUpdate).not.toHaveBeenCalled();
  });

  it('rejects DELIVERED -> CANCELLED through generic update', async () => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.DELIVERED,
    });

    await expect(
      service.update(baseShipment.id, {
        status: ShipmentStatus.CANCELLED,
      }),
    ).rejects.toThrow(/dedicated workflow endpoints/);

    expect(shipmentUpdate).not.toHaveBeenCalled();
  });

  it('allows a non-status shipment edit', async () => {
    shipmentFindUnique.mockResolvedValue(baseShipment);

    await service.update(baseShipment.id, {
      notes: 'Updated administrative notes.',
    });

    expect(shipmentUpdate).toHaveBeenCalledTimes(1);
  });

  it('allows keeping the existing status while editing other fields', async () => {
    shipmentFindUnique.mockResolvedValue(baseShipment);

    await service.update(baseShipment.id, {
      status: ShipmentStatus.DRAFT,
      description: 'Updated shipment description.',
    });

    expect(shipmentUpdate).toHaveBeenCalledTimes(1);
  });

  it('temporarily preserves pre-operational status changes', async () => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.DRAFT,
    });

    await service.update(baseShipment.id, {
      status: ShipmentStatus.QUOTED,
    });

    expect(shipmentUpdate).toHaveBeenCalledTimes(1);
  });
});
