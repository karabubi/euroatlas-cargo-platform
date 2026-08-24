import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';
import { join } from 'node:path';

export const vehiclePhotosUploadDirectory = join(
  process.cwd(),
  'uploads',
  'vehicle-photos',
);

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export const vehiclePhotoUploadOptions: MulterOptions = {
  storage: memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new BadRequestException(
          'Only JPG, PNG, WebP, HEIC and HEIF image files are allowed.',
        ),
        false,
      );

      return;
    }

    callback(null, true);
  },
};
