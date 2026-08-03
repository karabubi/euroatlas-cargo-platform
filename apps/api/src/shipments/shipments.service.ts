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
