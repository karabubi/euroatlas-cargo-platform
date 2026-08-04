import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { DamageArea, DamageSeverity } from '../../../generated/prisma/enums';

export class CreateDamageReportDto {
  @IsEnum(DamageArea)
  area!: DamageArea;

  @IsEnum(DamageSeverity)
  severity!: DamageSeverity;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 2,
  })
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @IsBoolean()
  requiresRepair?: boolean;

  @IsOptional()
  @IsBoolean()
  repaired?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  repairNotes?: string;
}
