import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import type { AuthenticatedUser } from '../auth/auth-user.type';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ChangeInspectionStatusDto } from './dto/change-inspection-status.dto';
import { CreateDamageReportDto } from './dto/create-damage-report.dto';
import { CreateVehicleInspectionDto } from './dto/create-vehicle-inspection.dto';
import { InspectionApprovalActionDto } from './dto/inspection-approval-action.dto';
import { UpdateDamageReportDto } from './dto/update-damage-report.dto';
import { UpdateVehicleInspectionDto } from './dto/update-vehicle-inspection.dto';
import { VehicleInspectionQueryDto } from './dto/vehicle-inspection-query.dto';
import { VehicleInspectionPdfService } from './vehicle-inspection-pdf.service';
import { VehicleInspectionsService } from './vehicle-inspections.service';

@UseGuards(JwtAuthGuard)
@Controller('vehicle-inspections')
export class VehicleInspectionsController {
  constructor(
    private readonly service: VehicleInspectionsService,
    private readonly pdfService: VehicleInspectionPdfService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateVehicleInspectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.create(dto, user.email);
  }

  @Get()
  findAll(@Query() query: VehicleInspectionQueryDto) {
    return this.service.findAll(query);
  }

  @Get('vehicle/:vehicleId')
  findByVehicle(@Param('vehicleId') vehicleId: string) {
    return this.service.findByVehicle(vehicleId);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string): Promise<StreamableFile> {
    const { buffer, fileName } = await this.pdfService.generate(id);

    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${fileName}"`,
    });
  }

  @Get(':id/approval-history')
  getApprovalHistory(@Param('id') id: string) {
    return this.service.getApprovalHistory(id);
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: InspectionApprovalActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.approve(id, user, dto.note);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: InspectionApprovalActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.reject(id, user, dto.note);
  }

  @Patch(':id/approval/revoke')
  revokeApproval(
    @Param('id') id: string,
    @Body() dto: InspectionApprovalActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.revokeApproval(id, user, dto.note);
  }

  @Get(':id/status-history')
  getStatusHistory(@Param('id') id: string) {
    return this.service.getStatusHistory(id);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeInspectionStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.changeStatus(id, dto, user.email);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleInspectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.email);
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
