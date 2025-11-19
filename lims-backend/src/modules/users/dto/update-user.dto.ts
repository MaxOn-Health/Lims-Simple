import {
  IsEmail,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  ValidateIf,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';
import { IsValidTestAdminType } from '../validators/is-valid-test-admin-type.validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'John Doe Updated',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'updated@lims.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'User role (SUPER_ADMIN only)',
    enum: UserRole,
    example: UserRole.DOCTOR,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid role specified' })
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Test technician type (required if role is TEST_TECHNICIAN)',
    example: 'xray',
  })
  @IsOptional()
  @ValidateIf((o) => o.role === UserRole.TEST_TECHNICIAN)
  @IsString({ message: 'Test technician type is required for TEST_TECHNICIAN role' })
  @IsValidTestAdminType({
    message: 'Invalid test technician type specified',
  })
  testTechnicianType?: string;

  @ApiPropertyOptional({
    description: 'User active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

