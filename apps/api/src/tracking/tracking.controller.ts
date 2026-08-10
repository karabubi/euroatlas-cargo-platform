import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';
import { TrackingService } from './tracking.service';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post()
  create(
    @Body()
    createTrackingDto: CreateTrackingDto,
  ) {
    return this.trackingService.create(createTrackingDto);
  }

  @Get()
  findAll() {
    return this.trackingService.findAll();
  }

  @Get('shipment/:shipmentId')
  findByShipment(
    @Param('shipmentId', new ParseUUIDPipe())
    shipmentId: string,
  ) {
    return this.trackingService.findByShipment(shipmentId);
  }

  @Get('public/:shipmentNo')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    publicTracking: {
      limit: 20,
      ttl: 60_000,
    },
  })
  findPublicByShipmentNo(
    @Param('shipmentNo')
    shipmentNo: string,
  ) {
    return this.trackingService.findPublicByShipmentNo(shipmentNo);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.trackingService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe())
    id: string,
    @Body()
    updateTrackingDto: UpdateTrackingDto,
  ) {
    return this.trackingService.update(id, updateTrackingDto);
  }

  @Delete(':id')
  remove(
    @Param('id', new ParseUUIDPipe())
    id: string,
  ) {
    return this.trackingService.remove(id);
  }
}
