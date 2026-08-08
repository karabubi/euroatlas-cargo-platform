import { ConflictException } from '@nestjs/common';

import { ShipmentStatus } from '../../generated/prisma/enums';

import { PrismaService } from '../prisma/prisma.service';
import { ShipmentsService } from './shipments.service';

describe('Shipment cancellation workflow', () => {
  let service: ShipmentsService;

  const shipmentFindUnique = jest.fn();

  const shipmentUpdate = jest.fn();

  const trackingCreate = jest.fn();

  const transaction = jest.fn();

  const transactionClient = {
    shipment: {
      update: shipmentUpdate,
    },

    shipmentTracking: {
      create: trackingCreate,
    },
  };

  const prismaMock = {
    shipment: {
      findUnique: shipmentFindUnique,
    },

    $transaction: transaction,
  };

  const baseShipment = {
    id: 'cancel-test-id',
    shipmentNo: 'EAC-CANCEL-001',
    customerId: 'customer-test-id',
    originCountry: 'Germany',
    destinationCountry: 'Libya',
    isActive: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    transaction.mockImplementation(
      (callback: (tx: typeof transactionClient) => unknown) =>
        callback(transactionClient),
    );

    service = new ShipmentsService(prismaMock as unknown as PrismaService);
  });

  it.each([
    ShipmentStatus.DRAFT,
    ShipmentStatus.QUOTED,
    ShipmentStatus.BOOKED,
    ShipmentStatus.RECEIVED,
    ShipmentStatus.LOADED,
  ])('allows cancellation from %s', async (status) => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status,
    });

    shipmentUpdate.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.CANCELLED,
    });

    trackingCreate.mockResolvedValue({
      id: 'tracking-cancel-001',
      shipmentId: baseShipment.id,
      status: ShipmentStatus.CANCELLED,
      createdAt: new Date(),
    });

    const result = await service.cancel(baseShipment.id, {
      reason: 'Customer cancelled shipment.',
      cancelledBy: 'Operations Team',
    });

    expect(transaction).toHaveBeenCalledTimes(1);

    expect(shipmentUpdate).toHaveBeenCalledTimes(1);

    expect(trackingCreate).toHaveBeenCalledTimes(1);

    expect(result.shipment.status).toBe(ShipmentStatus.CANCELLED);
  });

  it.each([
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.ARRIVED,
    ShipmentStatus.CUSTOMS_CLEARANCE,
    ShipmentStatus.READY_FOR_DELIVERY,
    ShipmentStatus.DELIVERED,
  ])('rejects cancellation from %s', async (status) => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status,
    });

    await expect(
      service.cancel(baseShipment.id, {
        reason: 'Attempted cancellation.',
      }),
    ).rejects.toThrow(ConflictException);

    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects cancelling an already cancelled shipment', async () => {
    shipmentFindUnique.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.CANCELLED,
    });

    await expect(
      service.cancel(baseShipment.id, {
        reason: 'Duplicate cancellation.',
      }),
    ).rejects.toThrow(/already cancelled/);

    expect(transaction).not.toHaveBeenCalled();
  });
});
