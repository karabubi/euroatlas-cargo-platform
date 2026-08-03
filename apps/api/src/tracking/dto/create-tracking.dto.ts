import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import {
  ShipmentStatus,
  TrackingEventType,
} from '../../../generated/prisma/client';

export class CreateTrackingDto {
  @IsUUID()
  shipmentId: string;

  @IsEnum(TrackingEventType)
  eventType: TrackingEventType;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsString()
  @MaxLength(150)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  createdBy?: string;
}
