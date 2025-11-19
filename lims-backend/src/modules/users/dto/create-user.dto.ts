import {
  IsEmail,
  IsString,
  IsEnum,
  ValidateIf,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';
import { IsStrongPassword } from '../../../common/decorators/is-strong-password.decorator';
import { IsValidTestAdminType } from '../validators/is-valid-test-admin-type.validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@lims.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'User password (must meet strength requirements)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @IsStrongPassword()
  password: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
  })
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  fullName: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.RECEPTIONIST,
  })
  @IsEnum(UserRole, { message: 'Invalid role specified' })
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Test technician type (required if role is TEST_TECHNICIAN)',
    example: 'audiometry',
  })
  @ValidateIf((o) => o.role === UserRole.TEST_TECHNICIAN)
  @IsString({ message: 'Test technician type is required for TEST_TECHNICIAN role' })
  @IsValidTestAdminType({
    message: 'Invalid test technician type specified',
  })
  testTechnicianType?: string;
}

