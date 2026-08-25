import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import { VehiclePhotosService } from './vehicle-photos.service';

describe('VehiclePhotosService repairLegacyPhoto', () => {
  const photoId = 'photo-1';
  const vehicleId = 'vehicle-1';

  const file = {
    originalname: 'recovered.webp',
    mimetype: 'image/webp',
    size: 30156,
    buffer: Buffer.from('photo'),
  } as Express.Multer.File;

  it('updates the existing row instead of creating a duplicate', async () => {
    const prisma = {
      vehiclePhoto: {
        findUnique: jest.fn().mockResolvedValue({
          id: photoId,
          vehicleId,
          storageProvider: 'LOCAL',
          remoteUrl: null,
          remotePublicId: null,
          storedName: 'legacy.webp',
        }),
        update: jest.fn().mockResolvedValue({
          id: photoId,
          vehicleId,
          storageProvider: 'CLOUDINARY',
          remoteUrl: 'https://example.com/photo.webp',
          remotePublicId: 'euroatlas/photo',
        }),
      },
    };

    const cloudinary = {
      uploadVehiclePhoto: jest.fn().mockResolvedValue({
        publicId: 'euroatlas/photo',
        secureUrl: 'https://example.com/photo.webp',
        bytes: 30156,
        format: 'webp',
        resourceType: 'image',
      }),
      deleteVehiclePhoto: jest.fn(),
    };

    const service = new VehiclePhotosService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryStorageService,
    );

    const result = await service.repairLegacyPhoto(photoId, file);

    expect(prisma.vehiclePhoto.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: photoId,
        },
        data: expect.objectContaining({
          storageProvider: 'CLOUDINARY',
          remotePublicId: 'euroatlas/photo',
          remoteUrl: 'https://example.com/photo.webp',
          size: 30156,
          mimeType: 'image/webp',
        }),
      }),
    );

    expect(result.id).toBe(photoId);
  });

  it('rejects a repair when the expected size targets another record', async () => {
    const prisma = {
      vehiclePhoto: {
        findUnique: jest.fn().mockResolvedValue({
          id: photoId,
          vehicleId,
          size: 30156,
          storageProvider: 'LOCAL',
          remoteUrl: null,
          remotePublicId: null,
          storedName: 'legacy.webp',
        }),
        update: jest.fn(),
      },
    };

    const cloudinary = {
      uploadVehiclePhoto: jest.fn(),
      deleteVehiclePhoto: jest.fn(),
    };

    const service = new VehiclePhotosService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryStorageService,
    );

    await expect(
      service.repairLegacyPhoto(photoId, file, 21100),
    ).rejects.toThrow('Vehicle photo record size mismatch');

    expect(cloudinary.uploadVehiclePhoto).not.toHaveBeenCalled();

    expect(prisma.vehiclePhoto.update).not.toHaveBeenCalled();
  });

  it('accepts the matching expected size', async () => {
    const prisma = {
      vehiclePhoto: {
        findUnique: jest.fn().mockResolvedValue({
          id: photoId,
          vehicleId,
          size: 30156,
          storageProvider: 'LOCAL',
          remoteUrl: null,
          remotePublicId: null,
          storedName: 'legacy.webp',
        }),
        update: jest.fn().mockResolvedValue({
          id: photoId,
          vehicleId,
          size: 30156,
          storageProvider: 'CLOUDINARY',
          remoteUrl: 'https://example.com/photo.webp',
          remotePublicId: 'euroatlas/photo',
        }),
      },
    };

    const cloudinary = {
      uploadVehiclePhoto: jest.fn().mockResolvedValue({
        publicId: 'euroatlas/photo',
        secureUrl: 'https://example.com/photo.webp',
        bytes: 30156,
        format: 'webp',
        resourceType: 'image',
      }),
      deleteVehiclePhoto: jest.fn(),
    };

    const service = new VehiclePhotosService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryStorageService,
    );

    await service.repairLegacyPhoto(photoId, file, 30156);

    expect(cloudinary.uploadVehiclePhoto).toHaveBeenCalledTimes(1);

    expect(prisma.vehiclePhoto.update).toHaveBeenCalledTimes(1);
  });
});
