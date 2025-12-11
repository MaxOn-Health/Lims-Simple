import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleInProject } from '../constants/role-in-project.enum';

export class ProjectMemberResponseDto {
    @ApiProperty({ description: 'Member ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174001' })
    userId: string;

    @ApiProperty({ description: 'User full name', example: 'John Doe' })
    userFullName: string;

    @ApiProperty({ description: 'User email', example: 'john@example.com' })
    userEmail: string;

    @ApiProperty({ description: 'User role in system', example: 'TEST_TECHNICIAN' })
    userRole: string;

    @ApiPropertyOptional({ description: 'Test technician type (for technicians)', example: 'eye_test' })
    testTechnicianType?: string | null;

    @ApiPropertyOptional({
        description: 'Role within the project',
        enum: RoleInProject,
        example: RoleInProject.MEMBER,
    })
    roleInProject?: RoleInProject | null;

    @ApiProperty({ description: 'Created at', example: '2025-01-01T00:00:00.000Z' })
    createdAt: Date;
}
