import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatientResponseDto } from './patient-response.dto';
import { TestProgressDto } from './test-progress.dto';
import { BloodSampleStatus } from '../../blood-samples/constants/blood-sample-status.enum';
import { PaginationMetaDto } from './paginated-patients-response.dto';

export class PatientProgressResponseDto extends PatientResponseDto {
  @ApiProperty({ type: [TestProgressDto], description: 'Progress for each test' })
  testProgress: TestProgressDto[];

  @ApiProperty({ description: 'Total number of tests expected', example: 5 })
  totalTestsExpected: number;

  @ApiProperty({ description: 'Number of tests assigned', example: 4 })
  testsAssigned: number;

  @ApiProperty({ description: 'Number of tests completed/submitted', example: 3 })
  testsCompleted: number;

  @ApiProperty({ description: 'Number of missing tests', example: 1 })
  missingTests: number;

  @ApiProperty({ description: 'Overall progress percentage (0-100)', example: 60 })
  overallProgress: number;

  @ApiProperty({ description: 'Whether patient has any missing items (tests or blood sample)', example: true })
  hasMissingItems: boolean;

  @ApiPropertyOptional({ 
    description: 'Blood sample status', 
    enum: BloodSampleStatus,
    example: BloodSampleStatus.COLLECTED 
  })
  bloodSampleStatus?: BloodSampleStatus | null;

  @ApiProperty({ description: 'Whether blood sample is missing', example: false })
  bloodSampleMissing: boolean;
}

export class PaginatedPatientProgressResponseDto {
  @ApiProperty({ type: [PatientProgressResponseDto], description: 'List of patients with progress' })
  data: PatientProgressResponseDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta: PaginationMetaDto;
}

