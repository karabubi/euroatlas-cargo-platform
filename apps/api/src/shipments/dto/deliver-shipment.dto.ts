import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeliverShipmentDto {
  @IsString()
  @MaxLength(200)
  location: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  deliveredTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  proofReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
