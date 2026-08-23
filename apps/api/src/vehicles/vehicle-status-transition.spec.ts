import { BadRequestException } from '@nestjs/common';
import { VehicleStatus } from '../../generated/prisma/enums';
import { VehiclesService } from './vehicles.service';

describe('VehiclesService vehicle status workflow', () => {
  let prisma: {
    vehicle: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    shipment: {
      findUnique: jest.Mock;
    };
  };

  let service: VehiclesService;

  const baseVehicle = {
    id: 'vehicle-1',
    vehicleNo: 'VEH-2026-0001',
    shipmentId: 'shipment-1',
    vin: 'WVWZZZ1JZXW000001',
    make: 'Porsche',
    model: '2023',
    status: VehicleStatus.REGISTERED,
    isActive: true,
  };

  beforeEach(() => {
    prisma = {
      vehicle: {
        findUnique: jest.fn().mockResolvedValue(baseVehicle),
        update: jest
          .fn()
          .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({
              ...baseVehicle,
              ...data,
            }),
          ),
      },
      shipment: {
        findUnique: jest.fn(),
      },
    };

    service = new VehiclesService(prisma as never);
  });

  it('allows REGISTERED -> RECEIVED', async () => {
    const result = await service.update(baseVehicle.id, {
      status: VehicleStatus.RECEIVED,
    });

    expect(result.status).toBe(VehicleStatus.RECEIVED);

    expect(prisma.vehicle.update).toHaveBeenCalled();
  });

  it('rejects REGISTERED -> DELIVERED', async () => {
    await expect(
      service.update(baseVehicle.id, {
        status: VehicleStatus.DELIVERED,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.vehicle.update).not.toHaveBeenCalled();
  });

  it('rejects a backward transition', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      ...baseVehicle,
      status: VehicleStatus.ARRIVED,
    });

    await expect(
      service.update(baseVehicle.id, {
        status: VehicleStatus.IN_TRANSIT,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.vehicle.update).not.toHaveBeenCalled();
  });

  it('allows cancellation from an active status', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      ...baseVehicle,
      status: VehicleStatus.IN_TRANSIT,
    });

    const result = await service.update(baseVehicle.id, {
      status: VehicleStatus.CANCELLED,
    });

    expect(result.status).toBe(VehicleStatus.CANCELLED);
  });

  it('rejects transitions after DELIVERED', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      ...baseVehicle,
      status: VehicleStatus.DELIVERED,
    });

    await expect(
      service.update(baseVehicle.id, {
        status: VehicleStatus.CANCELLED,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.vehicle.update).not.toHaveBeenCalled();
  });

  it('rejects transitions after CANCELLED', async () => {
    prisma.vehicle.findUnique.mockResolvedValue({
      ...baseVehicle,
      status: VehicleStatus.CANCELLED,
    });

    await expect(
      service.update(baseVehicle.id, {
        status: VehicleStatus.REGISTERED,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.vehicle.update).not.toHaveBeenCalled();
  });

  it('allows editing without changing status', async () => {
    const result = await service.update(baseVehicle.id, {
      make: 'Porsche AG',
    });

    expect(result.make).toBe('Porsche AG');

    expect(prisma.vehicle.update).toHaveBeenCalled();
  });

  it('allows saving the existing status', async () => {
    const result = await service.update(baseVehicle.id, {
      status: VehicleStatus.REGISTERED,
    });

    expect(result.status).toBe(VehicleStatus.REGISTERED);

    expect(prisma.vehicle.update).toHaveBeenCalled();
  });
});
