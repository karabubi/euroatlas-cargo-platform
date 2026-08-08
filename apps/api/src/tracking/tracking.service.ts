import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TrackingEventType } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';

@Injectable()
export class TrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTrackingDto: CreateTrackingDto) {
    const shipment = await this.prisma.shipment.findUnique({
      where: {
        id: createTrackingDto.shipmentId,
      },
      select: {
        id: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found.');
    }

    this.assertNoWorkflowMutation(createTrackingDto);

    return this.prisma.shipmentTracking.create({
      data: createTrackingDto,
    });
  }

  async findAll() {
    return this.prisma.shipmentTracking.findMany({
      include: {
        shipment: {
          select: {
            id: true,
            shipmentNo: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByShipment(shipmentId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: {
        id: shipmentId,
      },
      select: {
        id: true,
        shipmentNo: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found.');
    }

    const tracking = await this.prisma.shipmentTracking.findMany({
      where: {
        shipmentId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      shipment,
      tracking,
    };
  }

  async findOne(id: string) {
    const trackingEvent = await this.prisma.shipmentTracking.findUnique({
      where: {
        id,
      },
      include: {
        shipment: {
          select: {
            id: true,
            shipmentNo: true,
            status: true,
          },
        },
      },
    });

    if (!trackingEvent) {
      throw new NotFoundException('Tracking event not found.');
    }

    return trackingEvent;
  }

  async update(id: string, updateTrackingDto: UpdateTrackingDto) {
    const existingTrackingEvent = await this.findOne(id);

    if (existingTrackingEvent.eventType === TrackingEventType.STATUS_CHANGED) {
      throw new BadRequestException(
        'Workflow-generated status tracking events cannot be edited through the generic tracking API.',
      );
    }

    this.assertNoWorkflowMutation(updateTrackingDto);

    return this.prisma.shipmentTracking.update({
      where: {
        id,
      },
      data: updateTrackingDto,
    });
  }

  async remove(id: string) {
    const existingTrackingEvent = await this.findOne(id);

    if (existingTrackingEvent.eventType === TrackingEventType.STATUS_CHANGED) {
      throw new BadRequestException(
        'Workflow-generated status tracking events cannot be deleted through the generic tracking API.',
      );
    }

    await this.prisma.shipmentTracking.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Tracking event deleted successfully.',
    };
  }

  private assertNoWorkflowMutation(
    dto: Partial<Pick<CreateTrackingDto, 'eventType' | 'status'>>,
  ): void {
    if (
      dto.eventType === TrackingEventType.STATUS_CHANGED ||
      dto.status !== undefined
    ) {
      throw new BadRequestException(
        'Shipment workflow status changes must use the dedicated shipment workflow endpoints.',
      );
    }
  }
}
