import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../../common/decorators/is-strong-password.decorator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'OldPassword123!',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password (must meet strength requirements)',
    example: 'NewSecurePass123!',
    minLength: 8,
  })
  @IsString()
  @IsStrongPassword()
  newPassword: string;
}

