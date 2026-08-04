import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateDamageReportDto } from './dto/create-damage-report.dto';
import { CreateVehicleInspectionDto } from './dto/create-vehicle-inspection.dto';
import { UpdateDamageReportDto } from './dto/update-damage-report.dto';
import { UpdateVehicleInspectionDto } from './dto/update-vehicle-inspection.dto';
import { VehicleInspectionsService } from './vehicle-inspections.service';

@Controller('vehicle-inspections')
export class VehicleInspectionsController {
  constructor(private readonly service: VehicleInspectionsService) {}

  @Post()
  create(@Body() dto: CreateVehicleInspectionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('vehicle/:vehicleId')
  findByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.service.findByVehicle(vehicleId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVehicleInspectionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':inspectionId/damage-reports')
  createDamageReport(
    @Param('inspectionId') inspectionId: string,
    @Body() dto: CreateDamageReportDto,
  ) {
    return this.service.createDamageReport(inspectionId, dto);
  }

  @Patch('damage-reports/:id')
  updateDamageReport(
    @Param('id') id: string,
    @Body() dto: UpdateDamageReportDto,
  ) {
    return this.service.updateDamageReport(id, dto);
  }

  @Delete('damage-reports/:id')
  removeDamageReport(@Param('id') id: string) {
    return this.service.removeDamageReport(id);
  }
}
