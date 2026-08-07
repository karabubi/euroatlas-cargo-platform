import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ArrivalShipmentDto {
  @IsString()
  @MaxLength(200)
  location: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  receivedBy?: string;

  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
