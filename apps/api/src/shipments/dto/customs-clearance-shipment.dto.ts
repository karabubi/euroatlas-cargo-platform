import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CustomsClearanceShipmentDto {
  @IsString()
  @MaxLength(200)
  location: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  handledBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  customsReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
