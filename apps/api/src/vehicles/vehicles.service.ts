import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { VehicleStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVehicleDto: CreateVehicleDto) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: createVehicleDto.shipmentId },
      select: {
        id: true,
        shipmentNo: true,
        isActive: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found.');
    }

    if (!shipment.isActive) {
      throw new BadRequestException(
        'A vehicle cannot be added to an inactive shipment.',
      );
    }

    const normalizedVin = this.normalizeOptionalText(createVehicleDto.vin);

    if (normalizedVin) {
      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { vin: normalizedVin },
        select: { id: true },
      });

      if (existingVehicle) {
        throw new ConflictException('A vehicle with this VIN already exists.');
      }
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const vehicleNo = await this.allocateVehicleNumber(transaction);

        return transaction.vehicle.create({
          data: {
            vehicleNo,
            shipmentId: createVehicleDto.shipmentId,
            vin: normalizedVin,
            make: createVehicleDto.make.trim(),
            model: createVehicleDto.model.trim(),
            year: createVehicleDto.year,
            color: this.normalizeOptionalText(createVehicleDto.color),
            vehicleType: this.normalizeOptionalText(
              createVehicleDto.vehicleType,
            ),
            fuelType: this.normalizeOptionalText(createVehicleDto.fuelType),
            transmission: this.normalizeOptionalText(
              createVehicleDto.transmission,
            ),
            purchasePrice:
              createVehicleDto.purchasePrice === undefined
                ? undefined
                : new Prisma.Decimal(createVehicleDto.purchasePrice),
            declaredValue:
              createVehicleDto.declaredValue === undefined
                ? undefined
                : new Prisma.Decimal(createVehicleDto.declaredValue),
            hasKeys: createVehicleDto.hasKeys,
            isRunning: createVehicleDto.isRunning,
            hasDamage: createVehicleDto.hasDamage,
            damageDescription: this.normalizeOptionalText(
              createVehicleDto.damageDescription,
            ),
            notes: this.normalizeOptionalText(createVehicleDto.notes),
            isActive: createVehicleDto.isActive,
          },
          include: this.vehicleInclude,
        });
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(search?: string, status?: VehicleStatus, shipmentId?: string) {
    const trimmedSearch = search?.trim();

    return this.prisma.vehicle.findMany({
      where: {
        status,
        shipmentId,
        ...(trimmedSearch
          ? {
              OR: [
                {
                  vehicleNo: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  vin: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  make: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  model: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  color: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  shipment: {
                    shipmentNo: {
                      contains: trimmedSearch,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: this.vehicleInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: this.vehicleInclude,
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    return vehicle;
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto) {
    const currentVehicle = await this.findOne(id);

    if (
      updateVehicleDto.status !== undefined &&
      updateVehicleDto.status !== currentVehicle.status
    ) {
      this.assertValidStatusTransition(
        currentVehicle.status,
        updateVehicleDto.status,
      );
    }
    await this.findOne(id);

    if (updateVehicleDto.shipmentId) {
      const shipment = await this.prisma.shipment.findUnique({
        where: { id: updateVehicleDto.shipmentId },
        select: { id: true, isActive: true },
      });

      if (!shipment) {
        throw new NotFoundException('Shipment not found.');
      }

      if (!shipment.isActive) {
        throw new BadRequestException(
          'The vehicle cannot be assigned to an inactive shipment.',
        );
      }
    }

    const normalizedVin =
      updateVehicleDto.vin === undefined
        ? undefined
        : this.normalizeOptionalText(updateVehicleDto.vin);

    if (normalizedVin) {
      const existingVehicle = await this.prisma.vehicle.findUnique({
        where: { vin: normalizedVin },
        select: { id: true },
      });

      if (existingVehicle && existingVehicle.id !== id) {
        throw new ConflictException('A vehicle with this VIN already exists.');
      }
    }

    try {
      return await this.prisma.vehicle.update({
        where: { id },
        data: {
          shipmentId: updateVehicleDto.shipmentId,
          vin: normalizedVin,
          make: updateVehicleDto.make?.trim(),
          model: updateVehicleDto.model?.trim(),
          year: updateVehicleDto.year,
          color:
            updateVehicleDto.color === undefined
              ? undefined
              : this.normalizeOptionalText(updateVehicleDto.color),
          vehicleType:
            updateVehicleDto.vehicleType === undefined
              ? undefined
              : this.normalizeOptionalText(updateVehicleDto.vehicleType),
          fuelType:
            updateVehicleDto.fuelType === undefined
              ? undefined
              : this.normalizeOptionalText(updateVehicleDto.fuelType),
          transmission:
            updateVehicleDto.transmission === undefined
              ? undefined
              : this.normalizeOptionalText(updateVehicleDto.transmission),
          purchasePrice:
            updateVehicleDto.purchasePrice === undefined
              ? undefined
              : new Prisma.Decimal(updateVehicleDto.purchasePrice),
          declaredValue:
            updateVehicleDto.declaredValue === undefined
              ? undefined
              : new Prisma.Decimal(updateVehicleDto.declaredValue),
          hasKeys: updateVehicleDto.hasKeys,
          isRunning: updateVehicleDto.isRunning,
          hasDamage: updateVehicleDto.hasDamage,
          damageDescription:
            updateVehicleDto.damageDescription === undefined
              ? undefined
              : this.normalizeOptionalText(updateVehicleDto.damageDescription),
          status: updateVehicleDto.status,
          notes:
            updateVehicleDto.notes === undefined
              ? undefined
              : this.normalizeOptionalText(updateVehicleDto.notes),
          isActive: updateVehicleDto.isActive,
        },
        include: this.vehicleInclude,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async remove(id: string) {
    await this.findOne(id);

    try {
      return await this.prisma.vehicle.delete({
        where: { id },
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private assertValidStatusTransition(
    currentStatus: VehicleStatus,
    nextStatus: VehicleStatus,
  ): void {
    if (currentStatus === nextStatus) {
      return;
    }

    const allowedTransitions: Record<VehicleStatus, VehicleStatus[]> = {
      REGISTERED: [VehicleStatus.RECEIVED, VehicleStatus.CANCELLED],
      RECEIVED: [VehicleStatus.INSPECTED, VehicleStatus.CANCELLED],
      INSPECTED: [VehicleStatus.READY_FOR_LOADING, VehicleStatus.CANCELLED],
      READY_FOR_LOADING: [VehicleStatus.LOADED, VehicleStatus.CANCELLED],
      LOADED: [VehicleStatus.IN_TRANSIT, VehicleStatus.CANCELLED],
      IN_TRANSIT: [VehicleStatus.ARRIVED, VehicleStatus.CANCELLED],
      ARRIVED: [VehicleStatus.CUSTOMS_CLEARANCE, VehicleStatus.CANCELLED],
      CUSTOMS_CLEARANCE: [
        VehicleStatus.READY_FOR_DELIVERY,
        VehicleStatus.CANCELLED,
      ],
      READY_FOR_DELIVERY: [VehicleStatus.DELIVERED, VehicleStatus.CANCELLED],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (allowedTransitions[currentStatus].includes(nextStatus)) {
      return;
    }

    throw new BadRequestException(
      `Vehicle status cannot change from ${currentStatus} to ${nextStatus}.`,
    );
  }

  private async allocateVehicleNumber(
    transaction: Prisma.TransactionClient,
  ): Promise<string> {
    const year = new Date().getUTCFullYear();

    const rows = await transaction.$queryRaw<Array<{ lastValue: number }>>`
      INSERT INTO "VehicleNumberCounter" (
        "year",
        "lastValue",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${year},
        1,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT ("year")
      DO UPDATE SET
        "lastValue" =
          "VehicleNumberCounter"."lastValue" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE
        "VehicleNumberCounter"."lastValue" < 9999
      RETURNING "lastValue"
    `;

    const counter = rows[0];

    if (!counter) {
      throw new ConflictException(
        `Vehicle number sequence for ${year} is exhausted.`,
      );
    }

    return `VEH-${year}-${String(counter.lastValue).padStart(4, '0')}`;
  }

  private normalizeOptionalText(value?: string): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A vehicle with one of these unique values already exists.',
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('Vehicle not found.');
    }

    throw error;
  }

  private readonly vehicleInclude = {
    shipment: {
      select: {
        id: true,
        shipmentNo: true,
        status: true,
        originCountry: true,
        destinationCountry: true,
        customer: {
          select: {
            id: true,
            customerNo: true,
            companyName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    },
  } satisfies Prisma.VehicleInclude;
}
