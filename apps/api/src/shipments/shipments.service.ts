import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ShipmentStatus } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ArrivalShipmentDto } from './dto/arrival-shipment.dto';
import { CancelShipmentDto } from './dto/cancel-shipment.dto';
import { CustomsClearanceShipmentDto } from './dto/customs-clearance-shipment.dto';
import { ReadyForDeliveryShipmentDto } from './dto/ready-for-delivery-shipment.dto';
import { DeliverShipmentDto } from './dto/deliver-shipment.dto';
import { DispatchShipmentDto } from './dto/dispatch-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { isShipmentTransitionAllowed } from './shipment-workflow';

@Injectable()
export class ShipmentsService {
  private readonly readinessProtectedStatuses = new Set<ShipmentStatus>([
    ShipmentStatus.LOADED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.ARRIVED,
    ShipmentStatus.READY_FOR_DELIVERY,
    ShipmentStatus.DELIVERED,
  ]);

  private readonly controlledWorkflowStatuses = new Set<ShipmentStatus>([
    ShipmentStatus.LOADED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.ARRIVED,
    ShipmentStatus.CUSTOMS_CLEARANCE,
    ShipmentStatus.READY_FOR_DELIVERY,
    ShipmentStatus.DELIVERED,
    ShipmentStatus.CANCELLED,
  ]);

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

  async assertReadyForStatus(id: string, requestedStatus: ShipmentStatus) {
    if (!this.readinessProtectedStatuses.has(requestedStatus)) {
      return;
    }

    const readiness = await this.getReadiness(id);

    if (readiness.isReady) {
      return;
    }

    throw new ConflictException({
      statusCode: 409,
      code: 'SHIPMENT_NOT_READY',
      message: `Shipment cannot move to ${requestedStatus} because it is not ready.`,
      shipmentId: id,
      requestedStatus,
      readinessPercentage: readiness.readinessPercentage,
      blockers: readiness.blockers,
    });
  }

  async dispatch(id: string, dto: DispatchShipmentDto) {
    const allowedStatuses: ShipmentStatus[] = [
      ShipmentStatus.LOADED,
      ShipmentStatus.IN_TRANSIT,
    ];

    if (!allowedStatuses.includes(dto.status)) {
      throw new ConflictException(
        'A shipment can only be dispatched as LOADED or IN_TRANSIT.',
      );
    }

    const shipment = await this.findOne(id);

    if (
      shipment.status === ShipmentStatus.IN_TRANSIT ||
      shipment.status === ShipmentStatus.ARRIVED ||
      shipment.status === ShipmentStatus.CUSTOMS_CLEARANCE ||
      shipment.status === ShipmentStatus.READY_FOR_DELIVERY ||
      shipment.status === ShipmentStatus.DELIVERED
    ) {
      throw new ConflictException(
        `Shipment ${shipment.shipmentNo} has already been dispatched.`,
      );
    }

    if (!isShipmentTransitionAllowed(shipment.status, dto.status)) {
      throw new ConflictException(
        'A shipment must follow the dispatch workflow from DRAFT to LOADED to IN_TRANSIT.',
      );
    }

    await this.assertReadyForStatus(id, dto.status);

    const departureTime = dto.departureTime
      ? new Date(dto.departureTime)
      : new Date();

    return this.prisma.$transaction(async (transaction) => {
      const updatedShipment = await transaction.shipment.update({
        where: {
          id,
        },

        data: {
          status: dto.status,
          actualDeparture: departureTime,
        },

        include: {
          customer: true,
        },
      });

      const trackingEvent = await transaction.shipmentTracking.create({
        data: {
          shipmentId: id,
          eventType: 'STATUS_CHANGED',
          status: dto.status,
          title:
            dto.status === ShipmentStatus.IN_TRANSIT
              ? 'Shipment dispatched and in transit'
              : 'Shipment loaded for dispatch',
          description:
            dto.notes?.trim() ||
            `Shipment ${shipment.shipmentNo} was dispatched.`,
          location: dto.location.trim(),
          createdBy: dto.dispatchedBy?.trim() || null,
        },
      });

      return {
        message: 'Shipment dispatched successfully.',
        shipment: updatedShipment,
        trackingEvent,
        dispatchedAt: departureTime,
      };
    });
  }

  async markArrived(id: string, dto: ArrivalShipmentDto) {
    const shipment = await this.findOne(id);

    const alreadyArrivedStatuses: ShipmentStatus[] = [
      ShipmentStatus.ARRIVED,
      ShipmentStatus.CUSTOMS_CLEARANCE,
      ShipmentStatus.READY_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ];

    if (alreadyArrivedStatuses.includes(shipment.status)) {
      throw new ConflictException(
        `Shipment ${shipment.shipmentNo} has already arrived.`,
      );
    }

    if (!isShipmentTransitionAllowed(shipment.status, ShipmentStatus.ARRIVED)) {
      throw new ConflictException(
        `Shipment ${shipment.shipmentNo} must be IN_TRANSIT before arrival can be recorded.`,
      );
    }

    await this.assertReadyForStatus(id, ShipmentStatus.ARRIVED);

    const arrivalTime = dto.arrivalTime
      ? new Date(dto.arrivalTime)
      : new Date();

    return this.prisma.$transaction(async (transaction) => {
      const updatedShipment = await transaction.shipment.update({
        where: {
          id,
        },

        data: {
          status: ShipmentStatus.ARRIVED,
          actualArrival: arrivalTime,
        },

        include: {
          customer: true,
        },
      });

      const trackingEvent = await transaction.shipmentTracking.create({
        data: {
          shipmentId: id,
          eventType: 'STATUS_CHANGED',
          status: ShipmentStatus.ARRIVED,
          title: 'Shipment arrived at destination',
          description:
            dto.notes?.trim() ||
            `Shipment ${shipment.shipmentNo} arrived at the destination.`,
          location: dto.location.trim(),
          createdBy: dto.receivedBy?.trim() || null,
        },
      });

      return {
        message: 'Shipment arrival recorded successfully.',
        shipment: updatedShipment,
        trackingEvent,
        arrivedAt: arrivalTime,
      };
    });
  }

  async startCustomsClearance(id: string, dto: CustomsClearanceShipmentDto) {
    const shipment = await this.findOne(id);

    const customsOrLaterStatuses: ShipmentStatus[] = [
      ShipmentStatus.CUSTOMS_CLEARANCE,
      ShipmentStatus.READY_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ];

    if (customsOrLaterStatuses.includes(shipment.status)) {
      throw new ConflictException(
        `Shipment ${shipment.shipmentNo} has already entered customs clearance.`,
      );
    }

    if (
      !isShipmentTransitionAllowed(
        shipment.status,
        ShipmentStatus.CUSTOMS_CLEARANCE,
      )
    ) {
      throw new ConflictException(
        `Shipment ${shipment.shipmentNo} must be ARRIVED before customs clearance can start.`,
      );
    }

    await this.assertReadyForStatus(id, ShipmentStatus.CUSTOMS_CLEARANCE);

    const customsStartedAt = new Date();

    return this.prisma.$transaction(async (transaction) => {
      const updatedShipment = await transaction.shipment.update({
        where: {
          id,
        },

        data: {
          status: ShipmentStatus.CUSTOMS_CLEARANCE,
        },

        include: {
          customer: true,
        },
      });

      const reference = dto.customsReference?.trim();

      const defaultDescription = reference
        ? `Customs clearance started for shipment ${shipment.shipmentNo}. Reference: ${reference}.`
        : `Customs clearance started for shipment ${shipment.shipmentNo}.`;

      const trackingEvent = await transaction.shipmentTracking.create({
        data: {
          shipmentId: id,
          eventType: 'STATUS_CHANGED',
          status: ShipmentStatus.CUSTOMS_CLEARANCE,
          title: 'Customs clearance started',
          description: dto.notes?.trim() || defaultDescription,
          location: dto.location.trim(),
          createdBy: dto.handledBy?.trim() || null,
        },
      });

      return {
        message: 'Customs clearance started successfully.',
        shipment: updatedShipment,
        trackingEvent,
        customsReference: reference || null,
        customsStartedAt,
      };
    });
  }

  async markReadyForDelivery(id: string, dto: ReadyForDeliveryShipmentDto) {
    const shipment = await this.findOne(id);

    const readyOrLaterStatuses: ShipmentStatus[] = [
      ShipmentStatus.READY_FOR_DELIVERY,
      ShipmentStatus.DELIVERED,
    ];

    if (readyOrLaterStatuses.includes(shipment.status)) {
      throw new ConflictException(
        `Shipment ${shipment.shipmentNo} is already ready for delivery or delivered.`,
      );
    }

    if (
      !isShipmentTransitionAllowed(
        shipment.status,
        ShipmentStatus.READY_FOR_DELIVERY,
      )
    ) {
      throw new ConflictException(
        `Shipment ${shipment.shipmentNo} must be in CUSTOMS_CLEARANCE before it can be marked READY_FOR_DELIVERY.`,
      );
    }

    await this.assertReadyForStatus(id, ShipmentStatus.READY_FOR_DELIVERY);

    const readyAt = new Date();

    return this.prisma.$transaction(async (transaction) => {
      const updatedShipment = await transaction.shipment.update({
        where: {
          id,
        },

        data: {
          status: ShipmentStatus.READY_FOR_DELIVERY,
        },

        include: {
          customer: true,
        },
      });

      const reference = dto.releaseReference?.trim();

      const defaultDescription = reference
        ? `Shipment ${shipment.shipmentNo} was released and is ready for delivery. Reference: ${reference}.`
        : `Shipment ${shipment.shipmentNo} was released and is ready for delivery.`;

      const trackingEvent = await transaction.shipmentTracking.create({
        data: {
          shipmentId: id,
          eventType: 'STATUS_CHANGED',
          status: ShipmentStatus.READY_FOR_DELIVERY,
          title: 'Shipment ready for delivery',
          description: dto.notes?.trim() || defaultDescription,
          location: dto.location.trim(),
          createdBy: dto.releasedBy?.trim() || null,
        },
      });

      return {
        message: 'Shipment marked ready for delivery successfully.',
        shipment: updatedShipment,
        trackingEvent,
        releaseReference: reference || null,
        readyForDeliveryAt: readyAt,
      };
    });
  }

  async cancel(
    id: string,

    dto: CancelShipmentDto,
  ) {
    const shipment = await this.findOne(id);

    if (shipment.status === ShipmentStatus.CANCELLED) {
      throw new ConflictException(
        `Shipment ${shipment.shipmentNo} is already cancelled.`,
      );
    }

    if (
      !isShipmentTransitionAllowed(
        shipment.status,

        ShipmentStatus.CANCELLED,
      )
    ) {
      throw new ConflictException(
        `Shipment ${shipment.shipmentNo} cannot be cancelled from status ${shipment.status}.`,
      );
    }

    const reason = dto.reason.trim();

    const cancelledBy = dto.cancelledBy?.trim() || undefined;

    const location = dto.location?.trim() || undefined;

    const notes = dto.notes?.trim() || undefined;

    const description = notes ? `${reason} ${notes}` : reason;

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedShipment = await tx.shipment.update({
        where: {
          id,
        },

        data: {
          status: ShipmentStatus.CANCELLED,
        },

        include: {
          customer: true,
        },
      });

      const trackingEvent = await tx.shipmentTracking.create({
        data: {
          shipmentId: id,

          eventType: 'STATUS_CHANGED',

          status: ShipmentStatus.CANCELLED,

          title: 'Shipment cancelled',

          description,

          location,

          createdBy: cancelledBy,
        },
      });

      return {
        shipment: updatedShipment,

        trackingEvent,
      };
    });

    return {
      message: 'Shipment cancelled successfully.',

      shipment: result.shipment,

      trackingEvent: result.trackingEvent,

      cancellationReason: reason,

      cancelledBy,

      cancelledAt: result.trackingEvent.createdAt,
    };
  }

  async markDelivered(id: string, dto: DeliverShipmentDto) {
    const shipment = await this.findOne(id);

    if (shipment.status === ShipmentStatus.DELIVERED) {
      throw new ConflictException(
        `Shipment ${shipment.shipmentNo} has already been delivered.`,
      );
    }

    if (
      !isShipmentTransitionAllowed(shipment.status, ShipmentStatus.DELIVERED)
    ) {
      throw new ConflictException(
        `Shipment ${shipment.shipmentNo} must be READY_FOR_DELIVERY before final delivery can be recorded.`,
      );
    }

    await this.assertReadyForStatus(id, ShipmentStatus.DELIVERED);

    const deliveredAt = new Date();

    return this.prisma.$transaction(async (transaction) => {
      const updatedShipment = await transaction.shipment.update({
        where: {
          id,
        },

        data: {
          status: ShipmentStatus.DELIVERED,
        },

        include: {
          customer: true,
        },
      });

      const proofReference = dto.proofReference?.trim();

      const deliveredTo = dto.deliveredTo?.trim();

      let defaultDescription = `Shipment ${shipment.shipmentNo} was delivered successfully.`;

      if (deliveredTo) {
        defaultDescription = `Shipment ${shipment.shipmentNo} was delivered to ${deliveredTo}.`;
      }

      if (proofReference) {
        defaultDescription += ` Proof reference: ${proofReference}.`;
      }

      const trackingEvent = await transaction.shipmentTracking.create({
        data: {
          shipmentId: id,
          eventType: 'STATUS_CHANGED',
          status: ShipmentStatus.DELIVERED,
          title: 'Shipment delivered',
          description: dto.notes?.trim() || defaultDescription,
          location: dto.location.trim(),
          createdBy: deliveredTo || null,
        },
      });

      return {
        message: 'Shipment delivered successfully.',
        shipment: updatedShipment,
        trackingEvent,
        deliveredTo: deliveredTo || null,
        proofReference: proofReference || null,
        deliveredAt,
      };
    });
  }

  async update(id: string, updateShipmentDto: UpdateShipmentDto) {
    const shipment = await this.findOne(id);

    if (
      updateShipmentDto.status &&
      updateShipmentDto.status !== shipment.status
    ) {
      const touchesControlledWorkflow =
        this.controlledWorkflowStatuses.has(shipment.status) ||
        this.controlledWorkflowStatuses.has(updateShipmentDto.status);

      if (touchesControlledWorkflow) {
        throw new ConflictException(
          'Operational shipment status changes must use dedicated workflow endpoints.',
        );
      }

      if (
        !isShipmentTransitionAllowed(shipment.status, updateShipmentDto.status)
      ) {
        throw new ConflictException(
          `Shipment ${shipment.shipmentNo} cannot move from ${shipment.status} to ${updateShipmentDto.status}.`,
        );
      }

      await this.assertReadyForStatus(id, updateShipmentDto.status);
    }

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
