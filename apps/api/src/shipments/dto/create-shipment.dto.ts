import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { ShipmentStatus } from '../../../generated/prisma/enums';

export class CreateShipmentDto {
  @IsUUID()
  customerId: string;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsString()
  @MaxLength(100)
  originCountry: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  originCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  originPort?: string;

  @IsString()
  @MaxLength(100)
  destinationCountry: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  destinationCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  destinationPort?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bookingReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  containerNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  shippingLine?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  vesselName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  voyageNumber?: string;

  @IsOptional()
  @IsDateString()
  estimatedDeparture?: string;

  @IsOptional()
  @IsDateString()
  actualDeparture?: string;

  @IsOptional()
  @IsDateString()
  estimatedArrival?: string;

  @IsOptional()
  @IsDateString()
  actualArrival?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
