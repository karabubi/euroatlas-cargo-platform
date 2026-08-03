import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateVehicleDto {
  @IsUUID()
  @IsNotEmpty()
  shipmentId: string;

  @IsOptional()
  @IsString()
  @Length(5, 40)
  vin?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  make: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  model: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  color?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  vehicleType?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  fuelType?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  transmission?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  declaredValue?: number;

  @IsOptional()
  @IsBoolean()
  hasKeys?: boolean;

  @IsOptional()
  @IsBoolean()
  isRunning?: boolean;

  @IsOptional()
  @IsBoolean()
  hasDamage?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  damageDescription?: string;

  @IsOptional()
  @IsString()
  @Length(1, 3000)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
