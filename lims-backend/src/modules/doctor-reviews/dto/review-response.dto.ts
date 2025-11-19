import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatientResponseDto } from '../../patients/dto/patient-response.dto';
import { ResultResponseDto } from '../../results/dto/result-response.dto';
import { AssignmentResponseDto } from '../../assignments/dto/assignment-response.dto';
import { BloodSampleResponseDto } from '../../blood-samples/dto/blood-sample-response.dto';

export class ReviewResponseDto {
  @ApiProperty({ description: 'Review ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Patient ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  patientId: string;

  @ApiProperty({ description: 'Doctor ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  doctorId: string;

  @ApiPropertyOptional({ description: 'Doctor remarks', example: 'All results within normal range' })
  remarks: string | null;

  @ApiPropertyOptional({ description: 'Reviewed at timestamp' })
  reviewedAt: Date | null;

  @ApiPropertyOptional({ description: 'Signed at timestamp' })
  signedAt: Date | null;

  @ApiProperty({ description: 'Passkey verified', example: false })
  passkeyVerified: boolean;

  @ApiProperty({ description: 'Is signed', example: false })
  isSigned: boolean;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp' })
  updatedAt: Date;
}

export class PatientResultsResponseDto {
  @ApiProperty({ description: 'Patient details', type: PatientResponseDto })
  patient: PatientResponseDto;

  @ApiProperty({ description: 'List of test results', type: [ResultResponseDto] })
  results: ResultResponseDto[];

  @ApiProperty({ description: 'List of assignments', type: [AssignmentResponseDto] })
  assignments: AssignmentResponseDto[];

  @ApiPropertyOptional({ description: 'Blood sample information if applicable', type: BloodSampleResponseDto })
  bloodSample?: BloodSampleResponseDto;

  @ApiPropertyOptional({ description: 'Doctor review if exists' })
  review?: {
    id: string;
    remarks: string | null;
    reviewedAt: Date | null;
    signedAt: Date | null;
    isSigned: boolean;
  };
}
