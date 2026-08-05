import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { InspectionStatus } from '../../../generated/prisma/enums';

export class ChangeInspectionStatusDto {
  @IsEnum(InspectionStatus)
  status!: InspectionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
