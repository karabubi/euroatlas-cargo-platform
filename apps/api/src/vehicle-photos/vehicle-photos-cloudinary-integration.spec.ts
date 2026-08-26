import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import { VehiclePhotosController } from './vehicle-photos.controller';
import { VehiclePhotosService } from './vehicle-photos.service';

describe('vehicle photo Cloudinary integration', () => {
  const vehicleId = 'vehicle-1';

  const upload = {
    publicId: 'euroatlas/vehicle-photos/vehicle-1/photo-1',
    secureUrl: 'https://res.cloudinary.com/test/image/upload/photo-1.webp',
    bytes: 1234,
    format: 'webp',
    resourceType: 'image',
  };

  const file = {
    fieldname: 'file',
    originalname: 'car.webp',
    encoding: '7bit',
    mimetype: 'image/webp',
    size: 1234,
    buffer: Buffer.from('vehicle-photo'),
    destination: '',
    filename: '',
    path: '',
    stream: undefined,
  } as unknown as Express.Multer.File;

  function createPrisma() {
    const transaction = {
      vehiclePhoto: {
        updateMany: jest.fn().mockResolvedValue({
          count: 0,
        }),
        create: jest.fn(),
      },
    };

    const prisma = {
      vehicle: {
        findUnique: jest.fn().mockResolvedValue({
          id: vehicleId,
          vehicleNo: 'VEH-TEST-1',
        }),
      },
      vehiclePhoto: {
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(
        async (callback: (tx: typeof transaction) => Promise<unknown>) =>
          callback(transaction),
      ),
    };

    return {
      prisma,
      transaction,
    };
  }

  function createCloudinary(configured = true) {
    return {
      isConfigured: jest.fn().mockReturnValue(configured),
      uploadVehiclePhoto: jest.fn().mockResolvedValue(upload),
      deleteVehiclePhoto: jest.fn().mockResolvedValue(undefined),
    };
  }

  it('stores new production-style uploads as CLOUDINARY', async () => {
    const { prisma, transaction } = createPrisma();

    const cloudinary = createCloudinary(true);

    const createdRecord = {
      id: 'photo-db-1',
      vehicleId,
      originalName: file.originalname,
      storedName: upload.publicId,
      mimeType: file.mimetype,
      size: file.size,
      storageProvider: 'CLOUDINARY',
      remoteUrl: upload.secureUrl,
      remotePublicId: upload.publicId,
      isPrimary: true,
    };

    transaction.vehiclePhoto.create.mockResolvedValue(createdRecord);

    const service = new VehiclePhotosService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryStorageService,
    );

    const result = await service.create(
      vehicleId,
      {
        isPrimary: true,
        sortOrder: 0,
      },
      file,
    );

    expect(cloudinary.uploadVehiclePhoto).toHaveBeenCalledWith(
      file.buffer,
      vehicleId,
    );

    expect(transaction.vehiclePhoto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          storageProvider: 'CLOUDINARY',
          storedName: upload.publicId,
          remoteUrl: upload.secureUrl,
          remotePublicId: upload.publicId,
        }),
      }),
    );

    expect(result).toEqual(createdRecord);
  });

  it('removes Cloudinary asset if database transaction fails', async () => {
    const { prisma, transaction } = createPrisma();

    const cloudinary = createCloudinary(true);

    transaction.vehiclePhoto.create.mockRejectedValue(
      new Error('database failure'),
    );

    const service = new VehiclePhotosService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryStorageService,
    );

    await expect(service.create(vehicleId, {}, file)).rejects.toThrow(
      'database failure',
    );

    expect(cloudinary.deleteVehiclePhoto).toHaveBeenCalledWith(upload.publicId);
  });

  it('deletes Cloudinary asset before deleting its database record', async () => {
    const { prisma } = createPrisma();

    const cloudinary = createCloudinary(true);

    const service = new VehiclePhotosService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryStorageService,
    );

    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'photo-db-1',
      vehicleId,
      storageProvider: 'CLOUDINARY',
      remotePublicId: upload.publicId,
      remoteUrl: upload.secureUrl,
      storedName: upload.publicId,
    } as Awaited<ReturnType<VehiclePhotosService['findOne']>>);

    await service.remove('photo-db-1');

    expect(cloudinary.deleteVehiclePhoto).toHaveBeenCalledWith(upload.publicId);

    expect(prisma.vehiclePhoto.delete).toHaveBeenCalledWith({
      where: {
        id: 'photo-db-1',
      },
    });

    const cloudinaryOrder =
      cloudinary.deleteVehiclePhoto.mock.invocationCallOrder[0];

    const dbOrder = prisma.vehiclePhoto.delete.mock.invocationCallOrder[0];

    expect(cloudinaryOrder).toBeLessThan(dbOrder);
  });

  it('recognizes a complete Cloudinary record', () => {
    const { prisma } = createPrisma();

    const cloudinary = createCloudinary(true);

    const service = new VehiclePhotosService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryStorageService,
    );

    expect(
      service.isCloudinaryPhoto({
        storageProvider: 'CLOUDINARY',
        remoteUrl: upload.secureUrl,
      }),
    ).toBe(true);

    expect(
      service.getRemoteUrl({
        storageProvider: 'CLOUDINARY',
        remoteUrl: upload.secureUrl,
      }),
    ).toBe(upload.secureUrl);
  });

  it('does not treat legacy LOCAL records as Cloudinary', () => {
    const { prisma } = createPrisma();

    const cloudinary = createCloudinary(true);

    const service = new VehiclePhotosService(
      prisma as unknown as PrismaService,
      cloudinary as unknown as CloudinaryStorageService,
    );

    expect(
      service.isCloudinaryPhoto({
        storageProvider: 'LOCAL',
        remoteUrl: null,
      }),
    ).toBe(false);
  });
});

describe('vehicle photo controller Cloudinary compatibility', () => {
  const remoteUrl = 'https://res.cloudinary.com/test/image/upload/photo.webp';

  function responseMock() {
    return {
      redirect: jest.fn(),
      type: jest.fn(),
      setHeader: jest.fn(),
      sendFile: jest.fn(),
      download: jest.fn(),
    } as unknown as Response;
  }

  it('/file redirects Cloudinary photos without changing route contract', async () => {
    const service = {
      findOne: jest.fn().mockResolvedValue({
        id: 'photo-1',
        storageProvider: 'CLOUDINARY',
        remoteUrl,
      }),
      isCloudinaryPhoto: jest.fn().mockReturnValue(true),
      getRemoteUrl: jest.fn().mockReturnValue(remoteUrl),
    };

    const controller = new VehiclePhotosController(
      service as unknown as VehiclePhotosService,
    );

    const response = responseMock();

    await controller.viewFile('photo-1', response);

    expect(response.setHeader).toHaveBeenCalledWith(
      'Cross-Origin-Resource-Policy',
      'cross-origin',
    );

    expect(response.redirect).toHaveBeenCalledWith(302, remoteUrl);

    expect(response.sendFile).not.toHaveBeenCalled();
  });

  it('/download redirects Cloudinary photos without changing route contract', async () => {
    const service = {
      findOne: jest.fn().mockResolvedValue({
        id: 'photo-1',
        storageProvider: 'CLOUDINARY',
        remoteUrl,
      }),
      isCloudinaryPhoto: jest.fn().mockReturnValue(true),
      getRemoteUrl: jest.fn().mockReturnValue(remoteUrl),
    };

    const controller = new VehiclePhotosController(
      service as unknown as VehiclePhotosService,
    );

    const response = responseMock();

    await controller.download('photo-1', response);

    expect(response.setHeader).toHaveBeenCalledWith(
      'Cross-Origin-Resource-Policy',
      'cross-origin',
    );

    expect(response.redirect).toHaveBeenCalledWith(302, remoteUrl);

    expect(response.download).not.toHaveBeenCalled();
  });
});
