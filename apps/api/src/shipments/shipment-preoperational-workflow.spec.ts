import { ConflictException } from '@nestjs/common';

import { ShipmentStatus } from '../../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';
import { ShipmentsService } from './shipments.service';

describe('Shipment pre-operational workflow', () => {
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
    id: 'preop-test-id',
    shipmentNo: 'EAC-PREOP-001',
    customerId: 'customer-test-id',
    originCountry: 'Germany',
    destinationCountry: 'Libya',
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

  it.each([
    [ShipmentStatus.DRAFT, ShipmentStatus.QUOTED],
    [ShipmentStatus.QUOTED, ShipmentStatus.BOOKED],
    [ShipmentStatus.BOOKED, ShipmentStatus.RECEIVED],
  ])(
    'allows %s -> %s through generic update',
    async (currentStatus, targetStatus) => {
      shipmentFindUnique.mockResolvedValue({
        ...baseShipment,
        status: currentStatus,
      });

      await service.update(baseShipment.id, {
        status: targetStatus,
      });

      expect(shipmentUpdate).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    [ShipmentStatus.DRAFT, ShipmentStatus.BOOKED],
    [ShipmentStatus.DRAFT, ShipmentStatus.RECEIVED],
    [ShipmentStatus.QUOTED, ShipmentStatus.RECEIVED],
    [ShipmentStatus.BOOKED, ShipmentStatus.QUOTED],
  ])('rejects illegal %s -> %s', async (currentStatus, targetStatus) => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status: currentStatus,
    });

    await expect(
      service.update(baseShipment.id, {
        status: targetStatus,
      }),
    ).rejects.toThrow(ConflictException);

    expect(shipmentUpdate).not.toHaveBeenCalled();
  });

  it('requires RECEIVED -> LOADED to use the dispatch endpoint', async () => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.RECEIVED,
    });

    await expect(
      service.update(baseShipment.id, {
        status: ShipmentStatus.LOADED,
      }),
    ).rejects.toThrow(/dedicated workflow endpoints/);

    expect(shipmentUpdate).not.toHaveBeenCalled();
  });
});
