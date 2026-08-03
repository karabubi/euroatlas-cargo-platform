import { Injectable, NotFoundException } from '@nestjs/common';

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
        status: true,
      },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found.');
    }

    return this.prisma.$transaction(async (transaction) => {
      const trackingEvent = await transaction.shipmentTracking.create({
        data: createTrackingDto,
      });

      if (
        createTrackingDto.status &&
        createTrackingDto.status !== shipment.status
      ) {
        await transaction.shipment.update({
          where: {
            id: shipment.id,
          },
          data: {
            status: createTrackingDto.status,
          },
        });
      }

      return trackingEvent;
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
    await this.findOne(id);

    return this.prisma.$transaction(async (transaction) => {
      const trackingEvent = await transaction.shipmentTracking.update({
        where: {
          id,
        },
        data: updateTrackingDto,
      });

      if (updateTrackingDto.status) {
        await transaction.shipment.update({
          where: {
            id: trackingEvent.shipmentId,
          },
          data: {
            status: updateTrackingDto.status,
          },
        });
      }

      return trackingEvent;
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.shipmentTracking.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Tracking event deleted successfully.',
    };
  }
}
