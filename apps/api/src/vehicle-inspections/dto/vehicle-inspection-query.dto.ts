import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import {
  DamageSeverity,
  InspectionCondition,
  InspectionStatus,
  InspectionType,
} from '../../../generated/prisma/client';

function optionalTrimmedString({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();

  return trimmed || undefined;
}

function optionalBoolean({ value }: { value: unknown }): unknown {
  if (value === true || value === 'true' || value === '1') {
    return true;
  }

  if (value === false || value === 'false' || value === '0') {
    return false;
  }

  return value;
}

export class VehicleInspectionQueryDto {
  @IsOptional()
  @Transform(optionalTrimmedString)
  @IsString()
  search?: string;

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
  @IsEnum(DamageSeverity)
  damageSeverity?: DamageSeverity;

  @IsOptional()
  @Transform(optionalBoolean)
  @IsBoolean()
  hasVisibleDamage?: boolean;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 10;
}
