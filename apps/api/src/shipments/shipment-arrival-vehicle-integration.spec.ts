import { ShipmentStatus, VehicleStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentsService } from './shipments.service';

describe('Shipment arrival vehicle integration', () => {
  const shipmentId = 'shipment-arrival-integration';

  const shipment = {
    id: shipmentId,
    shipmentNo: 'EAC-ARRIVAL-TEST',
    customerId: 'customer-arrival-test',
    status: ShipmentStatus.IN_TRANSIT,
    originCountry: 'Germany',
    destinationCountry: 'Libya',
    isActive: true,
  };

  function createHarness({
    activeCount = 2,
    updatedCount = 2,
  }: {
    activeCount?: number;
    updatedCount?: number;
  } = {}) {
    const transaction = {
      vehicle: {
        count: jest.fn().mockResolvedValue(activeCount),
        updateMany: jest.fn().mockResolvedValue({
          count: updatedCount,
        }),
      },

      shipment: {
        update: jest
          .fn()
          .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({
              ...shipment,
              ...data,
            }),
          ),
      },

      shipmentTracking: {
        create: jest.fn().mockResolvedValue({
          id: 'tracking-arrival-test',
          shipmentId,
          eventType: 'STATUS_CHANGED',
          status: ShipmentStatus.ARRIVED,
        }),
      },
    };

    const prisma = {
      shipment: {
        findUnique: jest.fn().mockResolvedValue(shipment),
      },

      $transaction: jest.fn(
        (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };

    const service = new ShipmentsService(prisma as unknown as PrismaService);

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

    jest
      .spyOn(
        service as unknown as {
          notifyShipmentStatusChange: (id: string) => Promise<void>;
        },
        'notifyShipmentStatusChange',
      )
      .mockResolvedValue();

    return {
      service,
      prisma,
      transaction,
    };
  }

  it('advances all active IN_TRANSIT vehicles to ARRIVED', async () => {
    const { service, transaction } = createHarness();

    const result = await service.markArrived(shipmentId, {
      location: 'Tripoli Port',
      receivedBy: 'Destination Operations',
    });

    expect(transaction.vehicle.count).toHaveBeenCalledWith({
      where: {
        shipmentId,
        isActive: true,
      },
    });

    expect(transaction.vehicle.updateMany).toHaveBeenCalledWith({
      where: {
        shipmentId,
        isActive: true,
        status: VehicleStatus.IN_TRANSIT,
      },
      data: {
        status: VehicleStatus.ARRIVED,
      },
    });

    expect(transaction.shipment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: shipmentId,
        },
        data: expect.objectContaining({
          status: ShipmentStatus.ARRIVED,
        }),
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        message: 'Shipment arrival recorded successfully.',
        shipment: expect.objectContaining({
          status: ShipmentStatus.ARRIVED,
        }),
      }),
    );
  });

  it('keeps vehicle arrival, shipment arrival and tracking in one transaction', async () => {
    const { service, prisma, transaction } = createHarness();

    await service.markArrived(shipmentId, {
      location: 'Tripoli Port',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);

    expect(transaction.shipment.update).toHaveBeenCalledTimes(1);

    expect(transaction.shipmentTracking.create).toHaveBeenCalledTimes(1);
  });

  it('rejects arrival when shipment has no active vehicles', async () => {
    const { service, transaction } = createHarness({
      activeCount: 0,
      updatedCount: 0,
    });

    await expect(
      service.markArrived(shipmentId, {
        location: 'Tripoli Port',
      }),
    ).rejects.toThrow(
      'A shipment must contain at least one active vehicle before arrival can be recorded.',
    );

    expect(transaction.vehicle.updateMany).not.toHaveBeenCalled();

    expect(transaction.shipment.update).not.toHaveBeenCalled();

    expect(transaction.shipmentTracking.create).not.toHaveBeenCalled();
  });

  it('rejects arrival when any active vehicle is not IN_TRANSIT', async () => {
    const { service, transaction } = createHarness({
      activeCount: 3,
      updatedCount: 2,
    });

    await expect(
      service.markArrived(shipmentId, {
        location: 'Tripoli Port',
      }),
    ).rejects.toThrow(
      'All active shipment vehicles must be IN_TRANSIT before the shipment can be marked ARRIVED.',
    );

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);

    expect(transaction.shipment.update).not.toHaveBeenCalled();

    expect(transaction.shipmentTracking.create).not.toHaveBeenCalled();
  });

  it('ignores inactive vehicles during arrival eligibility', async () => {
    const { service, transaction } = createHarness({
      activeCount: 2,
      updatedCount: 2,
    });

    await service.markArrived(shipmentId, {
      location: 'Tripoli Port',
    });

    expect(transaction.vehicle.count).toHaveBeenCalledWith({
      where: {
        shipmentId,
        isActive: true,
      },
    });

    expect(transaction.vehicle.updateMany).toHaveBeenCalledWith({
      where: {
        shipmentId,
        isActive: true,
        status: VehicleStatus.IN_TRANSIT,
      },
      data: {
        status: VehicleStatus.ARRIVED,
      },
    });
  });

  it('stops shipment and tracking writes when vehicle arrival update fails', async () => {
    const { service, transaction } = createHarness();

    transaction.vehicle.updateMany.mockRejectedValue(
      new Error('vehicle arrival update failed'),
    );

    await expect(
      service.markArrived(shipmentId, {
        location: 'Tripoli Port',
      }),
    ).rejects.toThrow('vehicle arrival update failed');

    expect(transaction.shipment.update).not.toHaveBeenCalled();

    expect(transaction.shipmentTracking.create).not.toHaveBeenCalled();
  });

  it('stops tracking creation when shipment arrival update fails', async () => {
    const { service, transaction } = createHarness();

    transaction.shipment.update.mockRejectedValue(
      new Error('shipment arrival update failed'),
    );

    await expect(
      service.markArrived(shipmentId, {
        location: 'Tripoli Port',
      }),
    ).rejects.toThrow('shipment arrival update failed');

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);

    expect(transaction.shipmentTracking.create).not.toHaveBeenCalled();
  });

  it('keeps arrival operations in vehicle-check-update-shipment-tracking order', async () => {
    const { service, transaction } = createHarness();

    await service.markArrived(shipmentId, {
      location: 'Tripoli Port',
    });

    const countOrder = transaction.vehicle.count.mock.invocationCallOrder[0];

    const vehicleOrder =
      transaction.vehicle.updateMany.mock.invocationCallOrder[0];

    const shipmentOrder =
      transaction.shipment.update.mock.invocationCallOrder[0];

    const trackingOrder =
      transaction.shipmentTracking.create.mock.invocationCallOrder[0];

    expect(countOrder).toBeLessThan(vehicleOrder);

    expect(vehicleOrder).toBeLessThan(shipmentOrder);

    expect(shipmentOrder).toBeLessThan(trackingOrder);
  });

  it('propagates arrival tracking failure from the transaction', async () => {
    const { service, transaction } = createHarness();

    transaction.shipmentTracking.create.mockRejectedValue(
      new Error('arrival tracking failed'),
    );

    await expect(
      service.markArrived(shipmentId, {
        location: 'Tripoli Port',
      }),
    ).rejects.toThrow('arrival tracking failed');

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);

    expect(transaction.shipment.update).toHaveBeenCalledTimes(1);

    expect(transaction.shipmentTracking.create).toHaveBeenCalledTimes(1);
  });

  it('does not write shipment when arrival compare-and-set is incomplete', async () => {
    const { service, transaction } = createHarness({
      activeCount: 4,
      updatedCount: 3,
    });

    await expect(
      service.markArrived(shipmentId, {
        location: 'Tripoli Port',
      }),
    ).rejects.toThrow(
      'All active shipment vehicles must be IN_TRANSIT before the shipment can be marked ARRIVED.',
    );

    expect(transaction.vehicle.count).toHaveBeenCalledTimes(1);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);

    expect(transaction.shipment.update).not.toHaveBeenCalled();

    expect(transaction.shipmentTracking.create).not.toHaveBeenCalled();
  });

  it('does not run vehicle arrival outside the Prisma transaction', async () => {
    const { service, prisma, transaction } = createHarness();

    await service.markArrived(shipmentId, {
      location: 'Tripoli Port',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    expect(transaction.vehicle.count).toHaveBeenCalledTimes(1);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);
  });
});
