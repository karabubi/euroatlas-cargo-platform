import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@Injectable()
export class ShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createShipmentDto: CreateShipmentDto) {
    await this.ensureCustomerExists(createShipmentDto.customerId);

    const existingShipment = await this.prisma.shipment.findUnique({
      where: {
        shipmentNo: createShipmentDto.shipmentNo,
      },
    });

    if (existingShipment) {
      throw new ConflictException(
        `Shipment number ${createShipmentDto.shipmentNo} already exists.`,
      );
    }

    return this.prisma.shipment.create({
      data: this.prepareData(createShipmentDto),
      include: {
        customer: true,
      },
    });
  }

  async findAll(search?: string, status?: string) {
    const trimmedSearch = search?.trim();
    const trimmedStatus = status?.trim();

    return this.prisma.shipment.findMany({
      where: {
        isActive: true,

        ...(trimmedStatus
          ? {
              status: trimmedStatus as never,
            }
          : {}),

        ...(trimmedSearch
          ? {
              OR: [
                {
                  shipmentNo: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  bookingReference: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  containerNumber: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  destinationCountry: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  destinationCity: {
                    contains: trimmedSearch,
                    mode: 'insensitive',
                  },
                },
                {
                  customer: {
                    is: {
                      OR: [
                        {
                          firstName: {
                            contains: trimmedSearch,
                            mode: 'insensitive',
                          },
                        },
                        {
                          lastName: {
                            contains: trimmedSearch,
                            mode: 'insensitive',
                          },
                        },
                        {
                          companyName: {
                            contains: trimmedSearch,
                            mode: 'insensitive',
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: {
        id,
      },
      include: {
        customer: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} was not found.`);
    }

    return shipment;
  }

  async getReadiness(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: {
        id,
      },

      include: {
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
        },

        vehicles: {
          where: {
            isActive: true,
          },

          orderBy: {
            createdAt: 'asc',
          },

          include: {
            inspections: {
              orderBy: [
                {
                  inspectionDate: 'desc',
                },
                {
                  createdAt: 'desc',
                },
              ],

              include: {
                damageReports: {
                  orderBy: {
                    createdAt: 'desc',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} was not found.`);
    }

    const vehicleResults = shipment.vehicles.map((vehicle) => {
      const approvedInspection = vehicle.inspections.find(
        (inspection) =>
          inspection.status === 'COMPLETED' &&
          inspection.approvalStatus === 'APPROVED',
      );

      const unresolvedCriticalDamage = vehicle.inspections.flatMap(
        (inspection) =>
          inspection.damageReports.filter(
            (report) =>
              (report.severity === 'MAJOR' ||
                report.severity === 'TOTAL_LOSS') &&
              report.requiresRepair &&
              !report.repaired,
          ),
      );

      const latestInspection = vehicle.inspections[0] ?? null;

      return {
        id: vehicle.id,
        vehicleNo: vehicle.vehicleNo,
        make: vehicle.make,
        model: vehicle.model,
        status: vehicle.status,

        inspectionCount: vehicle.inspections.length,

        latestInspection: latestInspection
          ? {
              id: latestInspection.id,
              inspectionNo: latestInspection.inspectionNo,
              status: latestInspection.status,
              approvalStatus: latestInspection.approvalStatus,
              inspectionDate: latestInspection.inspectionDate,
            }
          : null,

        approvedInspection: approvedInspection
          ? {
              id: approvedInspection.id,
              inspectionNo: approvedInspection.inspectionNo,
              inspectionDate: approvedInspection.inspectionDate,
              approvedBy: approvedInspection.approvedBy,
              approvedAt: approvedInspection.approvedAt,
            }
          : null,

        hasApprovedInspection: Boolean(approvedInspection),

        unresolvedCriticalDamageCount: unresolvedCriticalDamage.length,

        unresolvedCriticalDamage: unresolvedCriticalDamage.map((report) => ({
          id: report.id,
          title: report.title,
          area: report.area,
          severity: report.severity,
          requiresRepair: report.requiresRepair,
          repaired: report.repaired,
        })),
      };
    });

    const vehiclesWithoutApprovedInspection = vehicleResults.filter(
      (vehicle) => !vehicle.hasApprovedInspection,
    );

    const vehiclesWithCriticalDamage = vehicleResults.filter(
      (vehicle) => vehicle.unresolvedCriticalDamageCount > 0,
    );

    const routeComplete = Boolean(
      shipment.originCountry?.trim() && shipment.destinationCountry?.trim(),
    );

    const hasBookingInformation = Boolean(
      shipment.bookingReference?.trim() ||
      shipment.containerNumber?.trim() ||
      shipment.shippingLine?.trim() ||
      shipment.vesselName?.trim(),
    );

    const checks = [
      {
        key: 'shipment-active',
        label: 'Shipment is active',
        passed: shipment.isActive,
        blocking: true,
        message: shipment.isActive
          ? 'The shipment is active.'
          : 'The shipment is inactive.',
      },

      {
        key: 'route-complete',
        label: 'Shipping route is complete',
        passed: routeComplete,
        blocking: true,
        message: routeComplete
          ? `${shipment.originCountry} to ${shipment.destinationCountry}`
          : 'Origin and destination countries are required.',
      },

      {
        key: 'booking-information',
        label: 'Booking information is available',
        passed: hasBookingInformation,
        blocking: false,
        message: hasBookingInformation
          ? 'Booking or transport information is available.'
          : 'Booking reference, container, shipping line or vessel information is missing.',
      },

      {
        key: 'vehicles-registered',
        label: 'Shipment contains vehicles',
        passed: shipment.vehicles.length > 0,
        blocking: true,
        message:
          shipment.vehicles.length > 0
            ? `${shipment.vehicles.length} active vehicle${
                shipment.vehicles.length === 1 ? '' : 's'
              } connected.`
            : 'No active vehicles are connected to this shipment.',
      },

      {
        key: 'inspections-approved',
        label: 'Every vehicle has an approved completed inspection',
        passed:
          shipment.vehicles.length > 0 &&
          vehiclesWithoutApprovedInspection.length === 0,
        blocking: true,
        message:
          vehiclesWithoutApprovedInspection.length === 0 &&
          shipment.vehicles.length > 0
            ? 'Every active vehicle has an approved completed inspection.'
            : `${vehiclesWithoutApprovedInspection.length} vehicle${
                vehiclesWithoutApprovedInspection.length === 1 ? '' : 's'
              } still require an approved completed inspection.`,
      },

      {
        key: 'critical-damage-resolved',
        label: 'Critical vehicle damage is resolved',
        passed: vehiclesWithCriticalDamage.length === 0,
        blocking: true,
        message:
          vehiclesWithCriticalDamage.length === 0
            ? 'No unresolved major or total-loss damage was found.'
            : `${vehiclesWithCriticalDamage.length} vehicle${
                vehiclesWithCriticalDamage.length === 1 ? '' : 's'
              } have unresolved critical damage.`,
      },

      {
        key: 'documents-uploaded',
        label: 'Shipment documents are uploaded',
        passed: shipment.documents.length > 0,
        blocking: true,
        message:
          shipment.documents.length > 0
            ? `${shipment.documents.length} document${
                shipment.documents.length === 1 ? '' : 's'
              } uploaded.`
            : 'At least one shipment document must be uploaded.',
      },
    ];

    const passedChecks = checks.filter((check) => check.passed).length;

    const readinessPercentage = Math.round(
      (passedChecks / checks.length) * 100,
    );

    const blockers = checks
      .filter((check) => check.blocking && !check.passed)
      .map((check) => ({
        key: check.key,
        label: check.label,
        message: check.message,
      }));

    const warnings = checks
      .filter((check) => !check.blocking && !check.passed)
      .map((check) => ({
        key: check.key,
        label: check.label,
        message: check.message,
      }));

    return {
      shipment: {
        id: shipment.id,
        shipmentNo: shipment.shipmentNo,
        status: shipment.status,
        isActive: shipment.isActive,
        originCountry: shipment.originCountry,
        destinationCountry: shipment.destinationCountry,
      },

      isReady: blockers.length === 0,
      readinessPercentage,

      summary: {
        totalChecks: checks.length,
        passedChecks,
        failedChecks: checks.length - passedChecks,
        blockerCount: blockers.length,
        warningCount: warnings.length,
        vehicleCount: shipment.vehicles.length,
        documentCount: shipment.documents.length,
        approvedVehicleCount: vehicleResults.filter(
          (vehicle) => vehicle.hasApprovedInspection,
        ).length,
        vehiclesRequiringInspection: vehiclesWithoutApprovedInspection.length,
        vehiclesWithCriticalDamage: vehiclesWithCriticalDamage.length,
      },

      checks,
      blockers,
      warnings,
      vehicles: vehicleResults,

      documents: shipment.documents.map((document) => ({
        id: document.id,
        category: document.category,
        title: document.title,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        createdAt: document.createdAt,
      })),

      evaluatedAt: new Date(),
    };
  }

  async update(id: string, updateShipmentDto: UpdateShipmentDto) {
    const shipment = await this.findOne(id);

    if (
      updateShipmentDto.customerId &&
      updateShipmentDto.customerId !== shipment.customerId
    ) {
      await this.ensureCustomerExists(updateShipmentDto.customerId);
    }

    if (
      updateShipmentDto.shipmentNo &&
      updateShipmentDto.shipmentNo !== shipment.shipmentNo
    ) {
      const duplicateShipment = await this.prisma.shipment.findUnique({
        where: {
          shipmentNo: updateShipmentDto.shipmentNo,
        },
      });

      if (duplicateShipment) {
        throw new ConflictException(
          `Shipment number ${updateShipmentDto.shipmentNo} already exists.`,
        );
      }
    }

    return this.prisma.shipment.update({
      where: {
        id,
      },
      data: this.prepareData(updateShipmentDto),
      include: {
        customer: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.shipment.delete({
      where: {
        id,
      },
      include: {
        customer: true,
      },
    });
  }

  private async ensureCustomerExists(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${customerId} was not found.`,
      );
    }
  }

  private prepareData<T extends CreateShipmentDto | UpdateShipmentDto>(
    data: T,
  ) {
    return {
      ...data,

      estimatedDeparture: data.estimatedDeparture
        ? new Date(data.estimatedDeparture)
        : undefined,

      actualDeparture: data.actualDeparture
        ? new Date(data.actualDeparture)
        : undefined,

      estimatedArrival: data.estimatedArrival
        ? new Date(data.estimatedArrival)
        : undefined,

      actualArrival: data.actualArrival
        ? new Date(data.actualArrival)
        : undefined,
    };
  }
}
