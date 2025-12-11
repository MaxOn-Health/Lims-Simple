import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleInProject } from '../constants/role-in-project.enum';

export class AddProjectMemberDto {
    @ApiProperty({
        description: 'User ID to add as project member',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID(4)
    userId: string;

    @ApiPropertyOptional({
        description: 'Role within the project',
        enum: RoleInProject,
        example: RoleInProject.MEMBER,
    })
    @IsOptional()
    @IsEnum(RoleInProject)
    roleInProject?: RoleInProject;
}
