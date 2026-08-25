import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  v2 as cloudinary,
  type UploadApiErrorResponse,
  type UploadApiResponse,
} from 'cloudinary';

export type CloudinaryVehiclePhotoUpload = {
  publicId: string;
  secureUrl: string;
  bytes: number;
  format: string;
  resourceType: string;
};

type CloudinaryDeleteResult = {
  result?: string;
};

@Injectable()
export class CloudinaryStorageService {
  constructor() {
    this.configure();
  }

  isConfigured(): boolean {
    return Boolean(
      process.env.CLOUDINARY_CLOUD_NAME?.trim() &&
      process.env.CLOUDINARY_API_KEY?.trim() &&
      process.env.CLOUDINARY_API_SECRET?.trim(),
    );
  }

  async verifyConnection(): Promise<{
    configured: boolean;
    reachable: boolean;
    cloudName: string | null;
  }> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() || null;

    if (!this.isConfigured()) {
      return {
        configured: false,
        reachable: false,
        cloudName,
      };
    }

    try {
      await cloudinary.api.ping();

      return {
        configured: true,
        reachable: true,
        cloudName,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown Cloudinary connection error.';

      throw new InternalServerErrorException(
        `Cloudinary connection failed: ${message}`,
      );
    }
  }

  async verifyUpload(): Promise<{
    uploadSucceeded: boolean;
    deleteSucceeded: boolean;
    publicId: string | null;
  }> {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ' +
        'AAAADUlEQVR42mNk+M/wHwAF/gL+3P8AAAAASUVORK5CYII=',
      'base64',
    );

    let publicId: string | null = null;

    try {
      const uploaded = await this.uploadVehiclePhoto(png, 'diagnostic');

      publicId = uploaded.publicId;

      await this.deleteVehiclePhoto(uploaded.publicId);

      return {
        uploadSucceeded: true,
        deleteSucceeded: true,
        publicId,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown Cloudinary upload error.';

      throw new InternalServerErrorException(
        `Cloudinary upload probe failed: ${message}`,
      );
    }
  }

  async uploadVehiclePhoto(
    buffer: Buffer,
    vehicleId: string,
  ): Promise<CloudinaryVehiclePhotoUpload> {
    this.assertConfigured();

    const result = await this.uploadBuffer(buffer, vehicleId);

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      bytes: result.bytes,
      format: result.format,
      resourceType: result.resource_type,
    };
  }

  async deleteVehiclePhoto(publicId: string): Promise<void> {
    this.assertConfigured();

    const response = (await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
    })) as CloudinaryDeleteResult;

    const result = response.result;

    if (result !== 'ok' && result !== 'not found') {
      throw new InternalServerErrorException(
        `Cloudinary delete failed: ${result ?? 'unknown response'}`,
      );
    }
  }

  private assertConfigured(): void {
    if (this.isConfigured()) {
      return;
    }

    throw new InternalServerErrorException(
      'Cloudinary vehicle photo storage is not configured.',
    );
  }

  private configure(): void {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();

    const apiKey = process.env.CLOUDINARY_API_KEY?.trim();

    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

    if (!cloudName || !apiKey || !apiSecret) {
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  private uploadBuffer(
    buffer: Buffer,
    vehicleId: string,
  ): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `euroatlas/vehicle-photos/${vehicleId}`,
          resource_type: 'image',
          use_filename: false,
          unique_filename: true,
          overwrite: false,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            reject(new Error(error.message || 'Cloudinary upload failed.'));
            return;
          }

          if (!result) {
            reject(new Error('Cloudinary returned no upload result.'));
            return;
          }

          resolve(result);
        },
      );

      stream.end(buffer);
    });
  }
}
