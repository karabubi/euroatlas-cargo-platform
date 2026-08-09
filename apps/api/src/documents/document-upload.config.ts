import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const documentsUploadDirectory = join(
  process.cwd(),
  'uploads',
  'documents',
);

export const documentUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: documentsUploadDirectory,

    filename: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();

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
          'Only PDF, JPG, PNG, and WebP files are allowed.',
        ),
        false,
      );

      return;
    }

    callback(null, true);
  },
};
