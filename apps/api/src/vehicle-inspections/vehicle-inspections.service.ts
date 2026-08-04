import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateDamageReportDto } from './dto/create-damage-report.dto';
import { CreateVehicleInspectionDto } from './dto/create-vehicle-inspection.dto';
import { UpdateDamageReportDto } from './dto/update-damage-report.dto';
import { UpdateVehicleInspectionDto } from './dto/update-vehicle-inspection.dto';

@Injectable()
export class VehicleInspectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleInspectionDto) {
    await this.ensureVehicleExists(dto.vehicleId);

    const inspectionNo = await this.generateInspectionNumber();

    return this.prisma.vehicleInspection.create({
      data: {
        inspectionNo,
        vehicleId: dto.vehicleId,
        type: dto.type,
        status: dto.status,
        condition: dto.condition,
        inspectionDate: dto.inspectionDate
          ? new Date(dto.inspectionDate)
          : undefined,
        location: this.optionalText(dto.location),
        inspectorName: this.optionalText(dto.inspectorName),
        odometer: dto.odometer,
        fuelLevel: dto.fuelLevel,
        hasKeys: dto.hasKeys,
        isRunning: dto.isRunning,
        hasVisibleDamage: dto.hasVisibleDamage ?? false,
        summary: this.optionalText(dto.summary),
        notes: this.optionalText(dto.notes),
      },
      include: this.inspectionInclude,
    });
  }

  findAll() {
    return this.prisma.vehicleInspection.findMany({
      orderBy: [
        {
          inspectionDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      include: this.inspectionInclude,
    });
  }

  async findByVehicle(vehicleId: string) {
    await this.ensureVehicleExists(vehicleId);

    return this.prisma.vehicleInspection.findMany({
      where: {
        vehicleId,
      },
      orderBy: [
        {
          inspectionDate: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      include: this.inspectionInclude,
    });
  }

  async findOne(id: string) {
    const inspection = await this.prisma.vehicleInspection.findUnique({
      where: {
        id,
      },
      include: this.inspectionInclude,
    });

    if (!inspection) {
      throw new NotFoundException(`Vehicle inspection ${id} was not found.`);
    }

    return inspection;
  }

  async update(id: string, dto: UpdateVehicleInspectionDto) {
    await this.findOne(id);

    if (dto.vehicleId) {
      await this.ensureVehicleExists(dto.vehicleId);
    }

    return this.prisma.vehicleInspection.update({
      where: {
        id,
      },
      data: {
        ...(dto.vehicleId !== undefined && {
          vehicleId: dto.vehicleId,
        }),
        ...(dto.type !== undefined && {
          type: dto.type,
        }),
        ...(dto.status !== undefined && {
          status: dto.status,
        }),
        ...(dto.condition !== undefined && {
          condition: dto.condition,
        }),
        ...(dto.inspectionDate !== undefined && {
          inspectionDate: new Date(dto.inspectionDate),
        }),
        ...(dto.location !== undefined && {
          location: this.optionalText(dto.location),
        }),
        ...(dto.inspectorName !== undefined && {
          inspectorName: this.optionalText(dto.inspectorName),
        }),
        ...(dto.odometer !== undefined && {
          odometer: dto.odometer,
        }),
        ...(dto.fuelLevel !== undefined && {
          fuelLevel: dto.fuelLevel,
        }),
        ...(dto.hasKeys !== undefined && {
          hasKeys: dto.hasKeys,
        }),
        ...(dto.isRunning !== undefined && {
          isRunning: dto.isRunning,
        }),
        ...(dto.hasVisibleDamage !== undefined && {
          hasVisibleDamage: dto.hasVisibleDamage,
        }),
        ...(dto.summary !== undefined && {
          summary: this.optionalText(dto.summary),
        }),
        ...(dto.notes !== undefined && {
          notes: this.optionalText(dto.notes),
        }),
      },
      include: this.inspectionInclude,
    });
  }

  async remove(id: string) {
    const inspection = await this.findOne(id);

    await this.prisma.vehicleInspection.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Vehicle inspection deleted successfully.',
      id: inspection.id,
      inspectionNo: inspection.inspectionNo,
    };
  }

  async createDamageReport(inspectionId: string, dto: CreateDamageReportDto) {
    await this.findOne(inspectionId);

    const damageReport = await this.prisma.vehicleDamageReport.create({
      data: {
        inspectionId,
        area: dto.area,
        severity: dto.severity,
        title: dto.title.trim(),
        description: this.optionalText(dto.description),
        estimatedCost: dto.estimatedCost,
        requiresRepair: dto.requiresRepair ?? true,
        repaired: dto.repaired ?? false,
        repairNotes: this.optionalText(dto.repairNotes),
      },
    });

    await this.prisma.vehicleInspection.update({
      where: {
        id: inspectionId,
      },
      data: {
        hasVisibleDamage: true,
      },
    });

    return damageReport;
  }

  async updateDamageReport(id: string, dto: UpdateDamageReportDto) {
    await this.findDamageReport(id);

    return this.prisma.vehicleDamageReport.update({
      where: {
        id,
      },
      data: {
        ...(dto.area !== undefined && {
          area: dto.area,
        }),
        ...(dto.severity !== undefined && {
          severity: dto.severity,
        }),
        ...(dto.title !== undefined && {
          title: dto.title.trim(),
        }),
        ...(dto.description !== undefined && {
          description: this.optionalText(dto.description),
        }),
        ...(dto.estimatedCost !== undefined && {
          estimatedCost: dto.estimatedCost,
        }),
        ...(dto.requiresRepair !== undefined && {
          requiresRepair: dto.requiresRepair,
        }),
        ...(dto.repaired !== undefined && {
          repaired: dto.repaired,
        }),
        ...(dto.repairNotes !== undefined && {
          repairNotes: this.optionalText(dto.repairNotes),
        }),
      },
    });
  }

  async removeDamageReport(id: string) {
    const damageReport = await this.findDamageReport(id);

    await this.prisma.vehicleDamageReport.delete({
      where: {
        id,
      },
    });

    const remainingDamageCount = await this.prisma.vehicleDamageReport.count({
      where: {
        inspectionId: damageReport.inspectionId,
      },
    });

    if (remainingDamageCount === 0) {
      await this.prisma.vehicleInspection.update({
        where: {
          id: damageReport.inspectionId,
        },
        data: {
          hasVisibleDamage: false,
        },
      });
    }

    return {
      message: 'Vehicle damage report deleted successfully.',
      id,
    };
  }

  private async findDamageReport(id: string) {
    const damageReport = await this.prisma.vehicleDamageReport.findUnique({
      where: {
        id,
      },
    });

    if (!damageReport) {
      throw new NotFoundException(`Vehicle damage report ${id} was not found.`);
    }

    return damageReport;
  }

  private async ensureVehicleExists(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        id: vehicleId,
      },
      select: {
        id: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} was not found.`);
    }
  }

  private async generateInspectionNumber() {
    const year = new Date().getFullYear();

    const count = await this.prisma.vehicleInspection.count({
      where: {
        inspectionNo: {
          startsWith: `INS-${year}-`,
        },
      },
    });

    return `INS-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private optionalText(value: string | undefined) {
    return value?.trim() || null;
  }

  private readonly inspectionInclude = {
    vehicle: {
      select: {
        id: true,
        vehicleNo: true,
        vin: true,
        make: true,
        model: true,
        year: true,
        color: true,
        status: true,
        shipment: {
          select: {
            id: true,
            shipmentNo: true,
            originCountry: true,
            destinationCountry: true,
          },
        },
      },
    },
    damageReports: {
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    _count: {
      select: {
        damageReports: true,
      },
    },
  };
}
