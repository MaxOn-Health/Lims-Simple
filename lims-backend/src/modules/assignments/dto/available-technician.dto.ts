import { ApiProperty } from '@nestjs/swagger';

export class AvailableTechnicianDto {
    @ApiProperty({
        description: 'User ID of the technician',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    id: string;

    @ApiProperty({
        description: 'Full name of the technician',
        example: 'John Smith',
    })
    fullName: string;

    @ApiProperty({
        description: 'Email address of the technician',
        example: 'john.smith@lims.com',
    })
    email: string;

    @ApiProperty({
        description: 'Type of test technician (matches test adminRole)',
        example: 'audiometry',
        nullable: true,
    })
    testTechnicianType: string | null;

    @ApiProperty({
        description: 'Number of active assignments (ASSIGNED or IN_PROGRESS status)',
        example: 3,
        required: false,
    })
    currentAssignmentCount?: number;

    @ApiProperty({
        description: 'Whether the technician is available for new assignments',
        example: true,
        required: false,
    })
    isAvailable?: boolean;
}
