import { Injectable, NotFoundException } from '@nestjs/common';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { PrismaService } from '../prisma/prisma.service';
import { documentsUploadDirectory } from './document-upload.config';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    shipmentId: string,
    dto: UploadDocumentDto,
    file: Express.Multer.File,
    uploadedBy?: string,
  ) {
    const shipment = await this.prisma.shipment.findUnique({
      where: {
        id: shipmentId,
      },

      select: {
        id: true,
      },
    });

    if (!shipment) {
      await this.removePhysicalFile(file.filename);

      throw new NotFoundException(`Shipment ${shipmentId} was not found.`);
    }

    return this.prisma.shipmentDocument.create({
      data: {
        shipmentId,
        title: dto.title.trim(),
        category: dto.category,
        description: dto.description?.trim() || null,
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: uploadedBy || null,
      },
    });
  }

  findAll() {
    return this.prisma.shipmentDocument.findMany({
      include: {
        shipment: {
          select: {
            id: true,
            shipmentNo: true,
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
      throw new NotFoundException(`Shipment ${shipmentId} was not found.`);
    }

    const documents = await this.prisma.shipmentDocument.findMany({
      where: {
        shipmentId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      shipment,
      documents,
    };
  }

  async findOne(id: string) {
    const document = await this.prisma.shipmentDocument.findUnique({
      where: {
        id,
      },

      include: {
        shipment: {
          select: {
            id: true,
            shipmentNo: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document ${id} was not found.`);
    }

    return document;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    await this.findOne(id);

    return this.prisma.shipmentDocument.update({
      where: {
        id,
      },

      data: {
        ...(dto.title !== undefined && {
          title: dto.title.trim(),
        }),

        ...(dto.category !== undefined && {
          category: dto.category,
        }),

        ...(dto.description !== undefined && {
          description: dto.description.trim() || null,
        }),
      },
    });
  }

  async remove(id: string) {
    const document = await this.findOne(id);

    await this.prisma.shipmentDocument.delete({
      where: {
        id,
      },
    });

    await this.removePhysicalFile(document.storedName);

    return {
      message: 'Document deleted successfully.',
      id,
    };
  }

  getFilePath(storedName: string) {
    return join(documentsUploadDirectory, storedName);
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
