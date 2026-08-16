import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { ArrivalShipmentDto } from './dto/arrival-shipment.dto';
import { CancelShipmentDto } from './dto/cancel-shipment.dto';
import { CustomsClearanceShipmentDto } from './dto/customs-clearance-shipment.dto';
import { ReadyForDeliveryShipmentDto } from './dto/ready-for-delivery-shipment.dto';
import { DeliverShipmentDto } from './dto/deliver-shipment.dto';
import { DispatchShipmentDto } from './dto/dispatch-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { ShipmentsService } from './shipments.service';

@UseGuards(JwtAuthGuard)
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  create(@Body() createShipmentDto: CreateShipmentDto) {
    return this.shipmentsService.create(createShipmentDto);
  }

  @Get()
  findAll(@Query('search') search?: string, @Query('status') status?: string) {
    return this.shipmentsService.findAll(search, status);
  }

  @Get(':id/notifications')
  getNotificationHistory(
    @Param('id')
    id: string,
  ) {
    return this.shipmentsService.getNotificationHistory(id);
  }

  @Post(':id/notifications/whatsapp')
  sendTrackingWhatsApp(
    @Param('id')
    id: string,
  ) {
    return this.shipmentsService.sendTrackingWhatsApp(id);
  }

  @Post(':id/notifications/email')
  sendTrackingEmail(
    @Param('id')
    id: string,
  ) {
    return this.shipmentsService.sendTrackingEmail(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelShipmentDto) {
    return this.shipmentsService.cancel(id, dto);
  }

  @Post(':id/delivery')
  markDelivered(@Param('id') id: string, @Body() dto: DeliverShipmentDto) {
    return this.shipmentsService.markDelivered(id, dto);
  }

  @Post(':id/ready-for-delivery')
  markReadyForDelivery(
    @Param('id') id: string,
    @Body() dto: ReadyForDeliveryShipmentDto,
  ) {
    return this.shipmentsService.markReadyForDelivery(id, dto);
  }

  @Post(':id/customs-clearance')
  startCustomsClearance(
    @Param('id') id: string,
    @Body() dto: CustomsClearanceShipmentDto,
  ) {
    return this.shipmentsService.startCustomsClearance(id, dto);
  }

  @Post(':id/arrival')
  markArrived(@Param('id') id: string, @Body() dto: ArrivalShipmentDto) {
    return this.shipmentsService.markArrived(id, dto);
  }

  @Post(':id/dispatch')
  dispatch(@Param('id') id: string, @Body() dto: DispatchShipmentDto) {
    return this.shipmentsService.dispatch(id, dto);
  }

  @Get(':id/readiness')
  getReadiness(@Param('id') id: string) {
    return this.shipmentsService.getReadiness(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shipmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateShipmentDto: UpdateShipmentDto,
  ) {
    return this.shipmentsService.update(id, updateShipmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shipmentsService.remove(id);
  }
}
