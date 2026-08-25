import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import { UpdateVehiclePhotoDto } from './dto/update-vehicle-photo.dto';
import { UploadVehiclePhotoDto } from './dto/upload-vehicle-photo.dto';
import { vehiclePhotosUploadDirectory } from './vehicle-photo-upload.config';

type StoredVehiclePhoto = {
  storageProvider: 'LOCAL' | 'CLOUDINARY';
  storedName: string;
  remoteUrl: string | null;
  remotePublicId: string | null;
};

@Injectable()
export class VehiclePhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryStorage: CloudinaryStorageService,
  ) {}

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
      throw new NotFoundException(`Vehicle ${vehicleId} was not found.`);
    }

    if (!file.buffer) {
      throw new InternalServerErrorException(
        'Vehicle photo upload buffer is missing.',
      );
    }

    const stored = await this.storeUploadedFile(vehicleId, file);

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
            storedName: stored.storedName,
            mimeType: file.mimetype,
            size: file.size,
            storageProvider: stored.storageProvider,
            remoteUrl: stored.remoteUrl,
            remotePublicId: stored.remotePublicId,
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
      await this.removeStoredFile(stored);
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

  getCloudinaryHealth() {
    return this.cloudinaryStorage.verifyConnection();
  }

  getCloudinaryUploadHealth() {
    return this.cloudinaryStorage.verifyUpload();
  }

  async repairLegacyPhoto(
    id: string,
    file: Express.Multer.File,
    expectedSize?: number,
  ) {
    const photo = await this.findOne(id);

    if (expectedSize !== undefined && photo.size !== expectedSize) {
      throw new BadRequestException(
        `Vehicle photo record size mismatch: expected ${expectedSize}, actual ${photo.size}.`,
      );
    }

    if (expectedSize !== undefined && file.size !== expectedSize) {
      throw new BadRequestException(
        `Uploaded file size mismatch: expected ${expectedSize}, actual ${file.size}.`,
      );
    }

    if (photo.storageProvider === 'CLOUDINARY') {
      throw new InternalServerErrorException(
        'Vehicle photo is already stored in Cloudinary.',
      );
    }

    if (!file.buffer) {
      throw new InternalServerErrorException(
        'Vehicle photo repair buffer is missing.',
      );
    }

    const uploaded = await this.cloudinaryStorage.uploadVehiclePhoto(
      file.buffer,
      photo.vehicleId,
    );

    try {
      return await this.prisma.vehiclePhoto.update({
        where: {
          id,
        },
        data: {
          storageProvider: 'CLOUDINARY',
          storedName: uploaded.publicId,
          remoteUrl: uploaded.secureUrl,
          remotePublicId: uploaded.publicId,
          mimeType: file.mimetype,
          size: file.size,
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
    } catch (error) {
      await this.cloudinaryStorage.deleteVehiclePhoto(uploaded.publicId);

      throw error;
    }
  }

  async remove(id: string) {
    const photo = await this.findOne(id);

    if (photo.storageProvider === 'CLOUDINARY' && photo.remotePublicId) {
      await this.cloudinaryStorage.deleteVehiclePhoto(photo.remotePublicId);
    }

    if (photo.storageProvider !== 'CLOUDINARY') {
      await this.removePhysicalFile(photo.storedName);
    }

    await this.prisma.vehiclePhoto.delete({
      where: {
        id,
      },
    });

    return {
      message: 'Vehicle photo deleted successfully.',
      id,
    };
  }

  isCloudinaryPhoto(photo: {
    storageProvider: string;
    remoteUrl: string | null;
  }): boolean {
    return photo.storageProvider === 'CLOUDINARY' && Boolean(photo.remoteUrl);
  }

  getRemoteUrl(photo: {
    storageProvider: string;
    remoteUrl: string | null;
  }): string {
    if (photo.storageProvider !== 'CLOUDINARY' || !photo.remoteUrl) {
      throw new InternalServerErrorException(
        'Cloudinary vehicle photo URL is missing.',
      );
    }

    return photo.remoteUrl;
  }

  getFilePath(storedName: string) {
    return join(vehiclePhotosUploadDirectory, storedName);
  }

  private async storeUploadedFile(
    vehicleId: string,
    file: Express.Multer.File,
  ): Promise<StoredVehiclePhoto> {
    if (this.cloudinaryStorage.isConfigured()) {
      const uploaded = await this.cloudinaryStorage.uploadVehiclePhoto(
        file.buffer,
        vehicleId,
      );

      return {
        storageProvider: 'CLOUDINARY',
        storedName: uploaded.publicId,
        remoteUrl: uploaded.secureUrl,
        remotePublicId: uploaded.publicId,
      };
    }

    return this.storeLocalFile(file);
  }

  private async storeLocalFile(
    file: Express.Multer.File,
  ): Promise<StoredVehiclePhoto> {
    await mkdir(vehiclePhotosUploadDirectory, {
      recursive: true,
    });

    const extension = extname(file.originalname).toLowerCase() || '.jpg';

    const storedName = `${Date.now()}-${randomUUID()}${extension}`;

    await writeFile(this.getFilePath(storedName), file.buffer);

    return {
      storageProvider: 'LOCAL',
      storedName,
      remoteUrl: null,
      remotePublicId: null,
    };
  }

  private async removeStoredFile(stored: StoredVehiclePhoto): Promise<void> {
    if (stored.storageProvider === 'CLOUDINARY' && stored.remotePublicId) {
      await this.cloudinaryStorage.deleteVehiclePhoto(stored.remotePublicId);

      return;
    }

    await this.removePhysicalFile(stored.storedName);
  }

  private async removePhysicalFile(storedName: string): Promise<void> {
    try {
      await unlink(this.getFilePath(storedName));
    } catch (error: unknown) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';

      if (code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
