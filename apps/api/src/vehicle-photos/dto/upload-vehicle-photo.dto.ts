import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { VehiclePhotoCategory } from '../../../generated/prisma/enums';

function transformBoolean({ value }: { value: unknown }): unknown {
  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return value;
}

export class UploadVehiclePhotoDto {
  @IsOptional()
  @IsEnum(VehiclePhotoCategory)
  category?: VehiclePhotoCategory = VehiclePhotoCategory.OTHER;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Transform(transformBoolean)
  @IsBoolean()
  isPrimary?: boolean = false;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;
}
