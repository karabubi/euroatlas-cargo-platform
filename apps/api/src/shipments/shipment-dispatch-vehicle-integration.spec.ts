import { ShipmentStatus, VehicleStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ShipmentsService } from './shipments.service';

describe('Shipment dispatch vehicle loading integration', () => {
  const shipmentId = 'shipment-vehicle-loading-test';

  const baseShipment = {
    id: shipmentId,
    shipmentNo: 'EAC-LOAD-TEST',
    customerId: 'customer-test',
    status: ShipmentStatus.RECEIVED,
    originCountry: 'Germany',
    destinationCountry: 'Libya',
    isActive: true,
  };

  let transaction: {
    vehicle: {
      count: jest.Mock;
      updateMany: jest.Mock;
    };
    shipment: {
      update: jest.Mock;
    };
    shipmentTracking: {
      create: jest.Mock;
    };
  };

  let prisma: {
    shipment: {
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  let service: ShipmentsService;

  beforeEach(() => {
    transaction = {
      vehicle: {
        count: jest.fn().mockResolvedValue(2),
        updateMany: jest.fn().mockResolvedValue({
          count: 2,
        }),
      },
      shipment: {
        update: jest
          .fn()
          .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({
              ...baseShipment,
              ...data,
            }),
          ),
      },
      shipmentTracking: {
        create: jest.fn().mockResolvedValue({
          id: 'tracking-load-test',
          shipmentId,
          status: ShipmentStatus.LOADED,
        }),
      },
    };

    prisma = {
      shipment: {
        findUnique: jest.fn().mockResolvedValue(baseShipment),
      },
      $transaction: jest.fn(
        (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };

    service = new ShipmentsService(prisma as unknown as PrismaService);

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
  });

  it('loads all READY_FOR_LOADING active vehicles when shipment dispatches to LOADED', async () => {
    const result = await service.dispatch(shipmentId, {
      status: ShipmentStatus.LOADED,
      location: 'Hamburg Port',
      dispatchedBy: 'Port Operations',
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
        status: VehicleStatus.READY_FOR_LOADING,
      },
      data: {
        status: VehicleStatus.LOADED,
      },
    });

    expect(transaction.shipment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: shipmentId,
        },
        data: expect.objectContaining({
          status: ShipmentStatus.LOADED,
        }),
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        message: 'Shipment dispatched successfully.',
        shipment: expect.objectContaining({
          status: ShipmentStatus.LOADED,
        }),
      }),
    );
  });

  it('keeps vehicle loading, shipment loading and tracking in one transaction', async () => {
    await service.dispatch(shipmentId, {
      status: ShipmentStatus.LOADED,
      location: 'Hamburg Port',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);

    expect(transaction.shipment.update).toHaveBeenCalledTimes(1);

    expect(transaction.shipmentTracking.create).toHaveBeenCalledTimes(1);
  });

  it('rejects shipment loading when any active vehicle is not READY_FOR_LOADING', async () => {
    transaction.vehicle.count.mockResolvedValue(2);

    transaction.vehicle.updateMany.mockResolvedValue({
      count: 1,
    });

    await expect(
      service.dispatch(shipmentId, {
        status: ShipmentStatus.LOADED,
        location: 'Hamburg Port',
      }),
    ).rejects.toThrow(
      'All active shipment vehicles must be READY_FOR_LOADING before the shipment can be loaded.',
    );

    expect(transaction.shipment.update).not.toHaveBeenCalled();

    expect(transaction.shipmentTracking.create).not.toHaveBeenCalled();
  });

  it('allows loading when every active attached vehicle is ready', async () => {
    transaction.vehicle.count.mockResolvedValue(3);

    transaction.vehicle.updateMany.mockResolvedValue({
      count: 3,
    });

    await expect(
      service.dispatch(shipmentId, {
        status: ShipmentStatus.LOADED,
        location: 'Hamburg Port',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        shipment: expect.objectContaining({
          status: ShipmentStatus.LOADED,
        }),
      }),
    );
  });

  it('does not apply READY_FOR_LOADING -> LOADED vehicle update during shipment LOADED -> IN_TRANSIT', async () => {
    prisma.shipment.findUnique.mockResolvedValue({
      ...baseShipment,
      status: ShipmentStatus.LOADED,
    });

    await service.dispatch(shipmentId, {
      status: ShipmentStatus.IN_TRANSIT,
      location: 'Mediterranean Sea',
    });

    expect(transaction.vehicle.count).not.toHaveBeenCalled();

    expect(transaction.vehicle.updateMany).not.toHaveBeenCalled();

    expect(transaction.shipment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ShipmentStatus.IN_TRANSIT,
        }),
      }),
    );
  });

  it('propagates vehicle loading failure before shipment or tracking writes', async () => {
    transaction.vehicle.updateMany.mockRejectedValue(
      new Error('vehicle loading failed'),
    );

    await expect(
      service.dispatch(shipmentId, {
        status: ShipmentStatus.LOADED,
        location: 'Hamburg Port',
      }),
    ).rejects.toThrow('vehicle loading failed');

    expect(transaction.shipment.update).not.toHaveBeenCalled();

    expect(transaction.shipmentTracking.create).not.toHaveBeenCalled();
  });
});

describe('Shipment dispatch vehicle loading hardening', () => {
  const shipmentId = 'shipment-loading-hardening';

  const shipment = {
    id: shipmentId,
    shipmentNo: 'EAC-LOAD-HARDEN',
    customerId: 'customer-hardening',
    status: ShipmentStatus.RECEIVED,
    originCountry: 'Germany',
    destinationCountry: 'Libya',
    isActive: true,
  };

  function createHarness({
    activeCount = 1,
    updatedCount = 1,
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
          id: 'tracking-hardening',
          shipmentId,
          status: ShipmentStatus.LOADED,
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

  it('rejects LOADED dispatch when shipment has no active vehicles', async () => {
    const { service, transaction } = createHarness({
      activeCount: 0,
      updatedCount: 0,
    });

    await expect(
      service.dispatch(shipmentId, {
        status: ShipmentStatus.LOADED,
        location: 'Hamburg Port',
      }),
    ).rejects.toThrow();

    expect(transaction.shipment.update).not.toHaveBeenCalled();

    expect(transaction.shipmentTracking.create).not.toHaveBeenCalled();
  });

  it('ignores inactive vehicles when checking loading eligibility', async () => {
    const { service, transaction } = createHarness({
      activeCount: 2,
      updatedCount: 2,
    });

    await service.dispatch(shipmentId, {
      status: ShipmentStatus.LOADED,
      location: 'Hamburg Port',
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
        status: VehicleStatus.READY_FOR_LOADING,
      },
      data: {
        status: VehicleStatus.LOADED,
      },
    });
  });

  it('does not create tracking event when shipment update fails after vehicle update', async () => {
    const { service, transaction } = createHarness();

    transaction.shipment.update.mockRejectedValue(
      new Error('shipment update failed'),
    );

    await expect(
      service.dispatch(shipmentId, {
        status: ShipmentStatus.LOADED,
        location: 'Hamburg Port',
      }),
    ).rejects.toThrow('shipment update failed');

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);

    expect(transaction.shipmentTracking.create).not.toHaveBeenCalled();
  });

  it('propagates tracking creation failure from the transaction', async () => {
    const { service, transaction } = createHarness();

    transaction.shipmentTracking.create.mockRejectedValue(
      new Error('tracking creation failed'),
    );

    await expect(
      service.dispatch(shipmentId, {
        status: ShipmentStatus.LOADED,
        location: 'Hamburg Port',
      }),
    ).rejects.toThrow('tracking creation failed');

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);

    expect(transaction.shipment.update).toHaveBeenCalledTimes(1);
  });

  it('does not run vehicle loading outside the Prisma transaction', async () => {
    const { service, prisma, transaction } = createHarness();

    await service.dispatch(shipmentId, {
      status: ShipmentStatus.LOADED,
      location: 'Hamburg Port',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    expect(transaction.vehicle.count).toHaveBeenCalledTimes(1);

    expect(transaction.vehicle.updateMany).toHaveBeenCalledTimes(1);
  });
});
