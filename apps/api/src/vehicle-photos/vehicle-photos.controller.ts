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

import { UpdateVehiclePhotoDto } from './dto/update-vehicle-photo.dto';
import { UploadVehiclePhotoDto } from './dto/upload-vehicle-photo.dto';
import { vehiclePhotoUploadOptions } from './vehicle-photo-upload.config';
import { VehiclePhotosService } from './vehicle-photos.service';

@Controller('vehicle-photos')
export class VehiclePhotosController {
  constructor(private readonly vehiclePhotosService: VehiclePhotosService) {}

  @Post('vehicle/:vehicleId')
  @UseInterceptors(FileInterceptor('file', vehiclePhotoUploadOptions))
  upload(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: UploadVehiclePhotoDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('A vehicle image file is required.');
    }

    return this.vehiclePhotosService.create(vehicleId, dto, file);
  }

  @Get('vehicle/:vehicleId')
  findByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.vehiclePhotosService.findByVehicle(vehicleId);
  }

  @Get(':id/file')
  async viewFile(@Param('id') id: string, @Res() response: Response) {
    const photo = await this.vehiclePhotosService.findOne(id);

    response.type(photo.mimeType);
    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    return response.sendFile(
      this.vehiclePhotosService.getFilePath(photo.storedName),
    );
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() response: Response) {
    const photo = await this.vehiclePhotosService.findOne(id);

    return response.download(
      this.vehiclePhotosService.getFilePath(photo.storedName),
      photo.originalName,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vehiclePhotosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehiclePhotoDto) {
    return this.vehiclePhotosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vehiclePhotosService.remove(id);
  }
}
