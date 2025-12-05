import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword } from '../../../common/decorators/is-strong-password.decorator';

export class ResetPasswordDto {
    @ApiProperty({
        description: 'Password reset token',
        example: 'abc123-token-xyz',
    })
    @IsString()
    @IsNotEmpty({ message: 'Token is required' })
    token: string;

    @ApiProperty({
        description: 'New password (must meet strength requirements)',
        example: 'NewSecurePass123!',
        minLength: 8,
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @IsStrongPassword()
    newPassword: string;
}
