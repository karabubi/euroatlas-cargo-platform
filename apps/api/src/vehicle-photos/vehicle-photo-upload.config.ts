import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export const vehiclePhotosUploadDirectory = join(
  process.cwd(),
  'apps',
  'api',
  'uploads',
  'vehicle-photos',
);

mkdirSync(vehiclePhotosUploadDirectory, {
  recursive: true,
});

export const vehiclePhotoUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: vehiclePhotosUploadDirectory,

    filename: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase() || '.jpg';

      const storedName = `${Date.now()}-${randomUUID()}${extension}`;

      callback(null, storedName);
    },
  }),

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
