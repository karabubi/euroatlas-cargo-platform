import { IsOptional, IsString, MaxLength } from 'class-validator';

export class InspectionApprovalActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
