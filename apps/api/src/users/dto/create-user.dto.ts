import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export const USER_ROLES = ['ADMIN', 'EMPLOYEE', 'CUSTOMER'] as const;

export type CreateUserRole = (typeof USER_ROLES)[number];

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsIn(USER_ROLES)
  role!: CreateUserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
