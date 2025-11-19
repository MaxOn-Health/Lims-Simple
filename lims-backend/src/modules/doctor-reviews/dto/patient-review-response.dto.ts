import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatientResponseDto } from '../../patients/dto/patient-response.dto';

export class PatientReviewResponseDto {
  @ApiProperty({ description: 'Patient details', type: PatientResponseDto })
  patient: PatientResponseDto;

  @ApiProperty({ description: 'Review status', example: 'PENDING' })
  status: 'PENDING' | 'REVIEWED' | 'SIGNED';

  @ApiPropertyOptional({ description: 'Review ID if exists' })
  reviewId?: string;

  @ApiPropertyOptional({ description: 'Reviewed at timestamp' })
  reviewedAt?: Date;

  @ApiPropertyOptional({ description: 'Signed at timestamp' })
  signedAt?: Date;

  @ApiProperty({ description: 'Total number of tests', example: 5 })
  totalTests: number;

  @ApiProperty({ description: 'Number of submitted tests', example: 5 })
  submittedTests: number;
}

export class PaginatedPatientsResponseDto {
  @ApiProperty({ description: 'List of patients', type: [PatientReviewResponseDto] })
  data: PatientReviewResponseDto[];

  @ApiProperty({ description: 'Total count', example: 50 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 5 })
  totalPages: number;
}
