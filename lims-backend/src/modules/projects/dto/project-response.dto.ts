import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '../constants/project-status.enum';

export class ProjectResponseDto {
  @ApiProperty({ description: 'Project ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Project name', example: 'TechCorp Annual Health Camp 2025' })
  name: string;

  @ApiProperty({ description: 'Project description', example: 'Annual health camp for TechCorp employees' })
  description: string;

  @ApiPropertyOptional({ description: 'Company name', example: 'TechCorp India Pvt Ltd' })
  companyName?: string | null;

  @ApiPropertyOptional({ description: 'Contact person name', example: 'John Doe' })
  contactPerson?: string | null;

  @ApiPropertyOptional({ description: 'Contact number', example: '+91-9876543210' })
  contactNumber?: string | null;

  @ApiPropertyOptional({ description: 'Contact email', example: 'contact@techcorp.com' })
  contactEmail?: string | null;

  @ApiPropertyOptional({ description: 'Project start date', example: '2025-12-20' })
  startDate?: Date | null;

  @ApiPropertyOptional({ description: 'Project end date', example: '2025-12-23' })
  endDate?: Date | null;

  @ApiPropertyOptional({ description: 'Camp location', example: 'TechCorp HQ, Bangalore' })
  campLocation?: string | null;

  @ApiPropertyOptional({
    description: 'Camp settings',
    example: {
      autoGeneratePatientIds: true,
      patientIdPrefix: 'CAMP2025',
      requireEmployeeId: true,
      defaultPackageId: '123e4567-e89b-12d3-a456-426614174000',
    },
  })
  campSettings?: {
    autoGeneratePatientIds?: boolean;
    patientIdPrefix?: string;
    requireEmployeeId?: boolean;
    defaultPackageId?: string;
  } | null;

  @ApiProperty({ description: 'Patient count', example: 150, default: 0 })
  patientCount: number;

  @ApiProperty({ description: 'Total revenue', example: 225000.00, default: 0 })
  totalRevenue: number;

  @ApiProperty({ description: 'Project status', enum: ProjectStatus, example: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @ApiPropertyOptional({ description: 'Additional notes' })
  notes?: string | null;

  @ApiProperty({ description: 'Created at', example: '2025-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2025-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

