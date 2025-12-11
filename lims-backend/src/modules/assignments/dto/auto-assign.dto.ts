import { ApiProperty } from '@nestjs/swagger';

export class AutoAssignPreviewItemDto {
    @ApiProperty()
    testId: string;

    @ApiProperty()
    testName: string;

    @ApiProperty({ nullable: true })
    adminId: string | null;

    @ApiProperty({ nullable: true })
    adminName: string | null;

    @ApiProperty({ nullable: true })
    adminEmail: string | null;

    @ApiProperty()
    adminRole: string;

    @ApiProperty()
    isAvailable: boolean;
}

export class AutoAssignRequestDto {
    @ApiProperty({ required: false, description: 'Map of testId to adminId for manual overrides' })
    overrides?: Record<string, string>;
}
