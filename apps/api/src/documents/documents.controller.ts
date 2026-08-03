import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { documentUploadOptions } from './document-upload.config';
import { DocumentsService } from './documents.service';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('shipment/:shipmentId')
  @UseInterceptors(FileInterceptor('file', documentUploadOptions))
  upload(
    @Param('shipmentId') shipmentId: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('A document file is required.');
    }

    return this.documentsService.create(shipmentId, dto, file);
  }

  @Get()
  findAll() {
    return this.documentsService.findAll();
  }

  @Get('shipment/:shipmentId')
  findByShipment(@Param('shipmentId') shipmentId: string) {
    return this.documentsService.findByShipment(shipmentId);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() response: Response) {
    const document = await this.documentsService.findOne(id);

    return response.download(
      this.documentsService.getFilePath(document.storedName),
      document.originalName,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
