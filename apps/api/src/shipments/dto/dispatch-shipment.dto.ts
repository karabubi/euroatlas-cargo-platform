import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ShipmentStatus } from '../../../generated/prisma/enums';

export class DispatchShipmentDto {
  @IsEnum(ShipmentStatus)
  status: ShipmentStatus;

  @IsString()
  @MaxLength(200)
  location: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  dispatchedBy?: string;

  @IsOptional()
  @IsDateString()
  departureTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
