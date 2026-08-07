import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReadyForDeliveryShipmentDto {
  @IsString()
  @MaxLength(200)
  location: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  releasedBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  releaseReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
