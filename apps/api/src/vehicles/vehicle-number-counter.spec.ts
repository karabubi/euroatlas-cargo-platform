import { ConflictException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';

type VehicleCreateArgs = {
  data: {
    vehicleNo: string;
    shipmentId: string;
    vin?: string | null;
    make: string;
    model: string;
  };
};

type VehicleResult = {
  id: string;
  vehicleNo: string;
  shipmentId: string;
  vin?: string | null;
  make: string;
  model: string;
};

type TransactionMock = {
  $queryRaw: jest.Mock<Promise<Array<{ lastValue: number }>>, []>;
  vehicle: {
    create: jest.Mock<Promise<VehicleResult>, [VehicleCreateArgs]>;
  };
};

describe('VehiclesService atomic vehicle numbering', () => {
  let prisma: {
    shipment: {
      findUnique: jest.Mock;
    };
    vehicle: {
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  let transaction: TransactionMock;
  let service: VehiclesService;

  const validDto = {
    shipmentId: '598d2a6d-5958-4aff-975a-ad796d39caed',
    vin: undefined,
    make: 'Volkswagen',
    model: 'Golf',
  };

  beforeEach(() => {
    jest.useFakeTimers();

    jest.setSystemTime(new Date('2026-08-23T12:00:00.000Z'));

    transaction = {
      $queryRaw: jest.fn(),
      vehicle: {
        create: jest.fn(),
      },
    };

    prisma = {
      shipment: {
        findUnique: jest.fn().mockResolvedValue({
          id: validDto.shipmentId,
          shipmentNo: 'EAC-2026-0003',
          isActive: true,
        }),
      },
      vehicle: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(
        (callback: (tx: TransactionMock) => Promise<unknown>) =>
          callback(transaction),
      ),
    };

    service = new VehiclesService(prisma as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('allocates VEH-2026-0002 from the atomic counter', async () => {
    transaction.$queryRaw.mockResolvedValue([
      {
        lastValue: 2,
      },
    ]);

    transaction.vehicle.create.mockImplementation(
      ({ data }: VehicleCreateArgs) =>
        Promise.resolve({
          id: 'vehicle-2',
          vehicleNo: data.vehicleNo,
          shipmentId: data.shipmentId,
          vin: data.vin,
          make: data.make,
          model: data.model,
        }),
    );

    const result = await service.create(validDto as never);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    expect(transaction.$queryRaw).toHaveBeenCalledTimes(1);

    expect(transaction.vehicle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          vehicleNo: 'VEH-2026-0002',
          shipmentId: validDto.shipmentId,
          make: 'Volkswagen',
          model: 'Golf',
        }),
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        vehicleNo: 'VEH-2026-0002',
      }),
    );
  });

  it('starts a new year at VEH-2027-0001', async () => {
    jest.setSystemTime(new Date('2027-01-01T00:00:00.000Z'));

    transaction.$queryRaw.mockResolvedValue([
      {
        lastValue: 1,
      },
    ]);

    transaction.vehicle.create.mockImplementation(
      ({ data }: VehicleCreateArgs) =>
        Promise.resolve({
          id: 'vehicle-2027-1',
          vehicleNo: data.vehicleNo,
          shipmentId: data.shipmentId,
          vin: data.vin,
          make: data.make,
          model: data.model,
        }),
    );

    const result = await service.create(validDto as never);

    expect(result).toEqual(
      expect.objectContaining({
        vehicleNo: 'VEH-2027-0001',
      }),
    );
  });

  it('rejects creation when the yearly sequence is exhausted', async () => {
    transaction.$queryRaw.mockResolvedValue([]);

    await expect(service.create(validDto as never)).rejects.toThrow(
      ConflictException,
    );

    expect(transaction.vehicle.create).not.toHaveBeenCalled();
  });

  it('keeps counter allocation and vehicle creation in one transaction', async () => {
    transaction.$queryRaw.mockResolvedValue([
      {
        lastValue: 2,
      },
    ]);

    transaction.vehicle.create.mockRejectedValue(
      new Error('vehicle insert failed'),
    );

    await expect(service.create(validDto as never)).rejects.toThrow(
      'vehicle insert failed',
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    expect(transaction.$queryRaw).toHaveBeenCalledTimes(1);

    expect(transaction.vehicle.create).toHaveBeenCalledTimes(1);
  });

  it('assigns consecutive numbers to two independent transactions', async () => {
    const tx1: TransactionMock = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          lastValue: 2,
        },
      ]),
      vehicle: {
        create: jest.fn(({ data }: VehicleCreateArgs) =>
          Promise.resolve({
            id: 'vehicle-2',
            vehicleNo: data.vehicleNo,
            shipmentId: data.shipmentId,
            vin: data.vin,
            make: data.make,
            model: data.model,
          }),
        ),
      },
    };

    const tx2: TransactionMock = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          lastValue: 3,
        },
      ]),
      vehicle: {
        create: jest.fn(({ data }: VehicleCreateArgs) =>
          Promise.resolve({
            id: 'vehicle-3',
            vehicleNo: data.vehicleNo,
            shipmentId: data.shipmentId,
            vin: data.vin,
            make: data.make,
            model: data.model,
          }),
        ),
      },
    };

    prisma.$transaction
      .mockImplementationOnce(
        (callback: (tx: TransactionMock) => Promise<unknown>) => callback(tx1),
      )
      .mockImplementationOnce(
        (callback: (tx: TransactionMock) => Promise<unknown>) => callback(tx2),
      );

    const [first, second] = await Promise.all([
      service.create(validDto as never),
      service.create(validDto as never),
    ]);

    expect(first).toEqual(
      expect.objectContaining({
        vehicleNo: 'VEH-2026-0002',
      }),
    );

    expect(second).toEqual(
      expect.objectContaining({
        vehicleNo: 'VEH-2026-0003',
      }),
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });
});
