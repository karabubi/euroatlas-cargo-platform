import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ShipmentStatus } from '../../../generated/prisma/enums';

export class DispatchShipmentDto {
  @IsIn([ShipmentStatus.LOADED, ShipmentStatus.IN_TRANSIT])
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
