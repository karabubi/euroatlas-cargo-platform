import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  InspectionCondition,
  InspectionStatus,
  InspectionType,
} from '../../../generated/prisma/enums';

export class UpdateVehicleInspectionDto {
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @IsOptional()
  @IsEnum(InspectionType)
  type?: InspectionType;

  @IsOptional()
  @IsEnum(InspectionStatus)
  status?: InspectionStatus;

  @IsOptional()
  @IsEnum(InspectionCondition)
  condition?: InspectionCondition;

  @IsOptional()
  @IsDateString()
  inspectionDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  inspectorName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  odometer?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  fuelLevel?: number;

  @IsOptional()
  @IsBoolean()
  hasKeys?: boolean;

  @IsOptional()
  @IsBoolean()
  isRunning?: boolean;

  @IsOptional()
  @IsBoolean()
  hasVisibleDamage?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;
}
