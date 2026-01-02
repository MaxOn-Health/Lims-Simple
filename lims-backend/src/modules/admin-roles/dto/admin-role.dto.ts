import { IsString, IsOptional, IsBoolean, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminRoleDto {
    @ApiProperty({ description: 'Unique name for the admin role (lowercase, no spaces)', example: 'blood_test' })
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    @Matches(/^[a-z][a-z0-9_]*$/, {
        message: 'Name must be lowercase, start with a letter, and contain only letters, numbers, and underscores',
    })
    name: string;

    @ApiProperty({ description: 'Display name for the admin role', example: 'Blood Test' })
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    displayName: string;

    @ApiProperty({ description: 'Description of the admin role', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
}

export class UpdateAdminRoleDto {
    @ApiProperty({ description: 'Display name for the admin role', required: false })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    displayName?: string;

    @ApiProperty({ description: 'Description of the admin role', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @ApiProperty({ description: 'Whether the role is active', required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class AdminRoleResponseDto {
    id: string;
    name: string;
    displayName: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
