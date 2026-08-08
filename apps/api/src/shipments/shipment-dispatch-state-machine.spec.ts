import { ConflictException } from '@nestjs/common';

import { ShipmentStatus } from '../../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';
import { ShipmentsService } from './shipments.service';

describe('Shipment dispatch state machine', () => {
  let service: ShipmentsService;

  const shipmentFindUnique = jest.fn();
  const transaction = jest.fn();

  const prismaMock = {
    shipment: {
      findUnique: shipmentFindUnique,
    },

    $transaction: transaction,
  };

  const baseShipment = {
    id: 'dispatch-test-id',
    shipmentNo: 'EAC-DISPATCH-TEST',
    customerId: 'customer-test-id',
    originCountry: 'Germany',
    destinationCountry: 'Libya',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ShipmentsService(prismaMock as unknown as PrismaService);
  });

  it('rejects DRAFT -> LOADED', async () => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.DRAFT,
    });

    await expect(
      service.dispatch(baseShipment.id, {
        status: ShipmentStatus.LOADED,
        location: 'Hamburg Port',
      }),
    ).rejects.toThrow(ConflictException);

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects RECEIVED -> IN_TRANSIT', async () => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.RECEIVED,
    });

    await expect(
      service.dispatch(baseShipment.id, {
        status: ShipmentStatus.IN_TRANSIT,
        location: 'Hamburg Port',
      }),
    ).rejects.toThrow(ConflictException);

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects LOADED -> LOADED', async () => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.LOADED,
    });

    await expect(
      service.dispatch(baseShipment.id, {
        status: ShipmentStatus.LOADED,
        location: 'Hamburg Port',
      }),
    ).rejects.toThrow(ConflictException);

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects dispatch after IN_TRANSIT', async () => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.IN_TRANSIT,
    });

    await expect(
      service.dispatch(baseShipment.id, {
        status: ShipmentStatus.IN_TRANSIT,
        location: 'Hamburg Port',
      }),
    ).rejects.toThrow(/already been dispatched/);

    expect(transaction).not.toHaveBeenCalled();
  });
});
