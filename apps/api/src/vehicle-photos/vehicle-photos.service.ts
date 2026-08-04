import { Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateVehiclePhotoDto } from './dto/update-vehicle-photo.dto';
import { UploadVehiclePhotoDto } from './dto/upload-vehicle-photo.dto';
import { vehiclePhotosUploadDirectory } from './vehicle-photo-upload.config';

@Injectable()
export class VehiclePhotosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    vehicleId: string,
    dto: UploadVehiclePhotoDto,
    file: Express.Multer.File,
    uploadedBy?: string,
  ) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        id: vehicleId,
      },

      select: {
        id: true,
        vehicleNo: true,
      },
    });

    if (!vehicle) {
      await this.removePhysicalFile(file.filename);

      throw new NotFoundException(`Vehicle ${vehicleId} was not found.`);
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        if (dto.isPrimary) {
          await transaction.vehiclePhoto.updateMany({
            where: {
              vehicleId,
              isPrimary: true,
            },

            data: {
              isPrimary: false,
            },
          });
        }

        return transaction.vehiclePhoto.create({
          data: {
            vehicleId,
            category: dto.category,
            title: dto.title?.trim() || null,
            description: dto.description?.trim() || null,
            originalName: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            isPrimary: dto.isPrimary ?? false,
            sortOrder: dto.sortOrder ?? 0,
            uploadedBy: uploadedBy || null,
          },

          include: {
            vehicle: {
              select: {
                id: true,
                vehicleNo: true,
                make: true,
                model: true,
              },
            },
          },
        });
      });
    } catch (error) {
      await this.removePhysicalFile(file.filename);
      throw error;
    }
  }

  async findByVehicle(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: {
        id: vehicleId,
      },

      select: {
        id: true,
        vehicleNo: true,
        vin: true,
        make: true,
        model: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle ${vehicleId} was not found.`);
    }

    const photos = await this.prisma.vehiclePhoto.findMany({
      where: {
        vehicleId,
      },

      orderBy: [
        {
          isPrimary: 'desc',
        },
        {
          sortOrder: 'asc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return {
      vehicle,
      photos,
    };
  }

  async findOne(id: string) {
    const photo = await this.prisma.vehiclePhoto.findUnique({
      where: {
        id,
      },

      include: {
        vehicle: {
          select: {
            id: true,
            vehicleNo: true,
            vin: true,
            make: true,
            model: true,
          },
        },
      },
    });

    if (!photo) {
      throw new NotFoundException(`Vehicle photo ${id} was not found.`);
    }

    return photo;
  }

  async update(id: string, dto: UpdateVehiclePhotoDto) {
    const existingPhoto = await this.findOne(id);

    return this.prisma.$transaction(async (transaction) => {
      if (dto.isPrimary === true) {
        await transaction.vehiclePhoto.updateMany({
          where: {
            vehicleId: existingPhoto.vehicleId,
            isPrimary: true,
            id: {
              not: id,
            },
          },

          data: {
            isPrimary: false,
          },
        });
      }

      return transaction.vehiclePhoto.update({
        where: {
          id,
        },

        data: {
          ...(dto.category !== undefined && {
            category: dto.category,
          }),

          ...(dto.title !== undefined && {
            title: dto.title.trim() || null,
          }),

          ...(dto.description !== undefined && {
            description: dto.description.trim() || null,
          }),

          ...(dto.isPrimary !== undefined && {
            isPrimary: dto.isPrimary,
          }),

          ...(dto.sortOrder !== undefined && {
            sortOrder: dto.sortOrder,
          }),
        },

        include: {
          vehicle: {
            select: {
              id: true,
              vehicleNo: true,
              make: true,
              model: true,
            },
          },
        },
      });
    });
  }

  async remove(id: string) {
    const photo = await this.findOne(id);

    await this.prisma.vehiclePhoto.delete({
      where: {
        id,
      },
    });

    await this.removePhysicalFile(photo.storedName);

    return {
      message: 'Vehicle photo deleted successfully.',
      id,
    };
  }

  getFilePath(storedName: string) {
    return join(vehiclePhotosUploadDirectory, storedName);
  }

  private async removePhysicalFile(storedName: string) {
    try {
      await unlink(this.getFilePath(storedName));
    } catch (error) {
      const code =
        error instanceof Error && 'code' in error ? String(error.code) : '';

      if (code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
