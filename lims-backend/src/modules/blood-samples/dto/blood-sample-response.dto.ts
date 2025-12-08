import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodSampleStatus } from '../constants/blood-sample-status.enum';
import { Gender } from '../../patients/constants/gender.enum';

class PatientNestedDto {
  @ApiProperty({ description: 'Patient UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Patient ID', example: 'PAT-20241110-0001' })
  patientId: string;

  @ApiProperty({ description: 'Patient name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Patient age', example: 35 })
  age: number;

  @ApiProperty({ description: 'Patient gender', enum: Gender, example: Gender.MALE })
  gender: Gender;

  @ApiProperty({ description: 'Contact number', example: '+1234567890' })
  contactNumber: string;
}

class UserNestedDto {
  @ApiProperty({ description: 'User UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User full name', example: 'John User' })
  fullName: string;
}

export class BloodSampleResponseDto {
  @ApiProperty({ description: 'Blood sample UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Patient UUID', example: 'uuid' })
  patientId: string;

  @ApiProperty({ description: 'Sample ID (BL-YYYYMMDD-XXXX)', example: 'BL-20241110-0001' })
  sampleId: string;

  @ApiProperty({ description: 'Collection timestamp', example: '2024-11-10T08:00:00.000Z' })
  collectedAt: Date;

  @ApiProperty({ description: 'User ID who collected the sample', example: 'uuid' })
  collectedBy: string;

  @ApiProperty({ description: 'Sample status', enum: BloodSampleStatus, example: BloodSampleStatus.COLLECTED })
  status: BloodSampleStatus;

  @ApiPropertyOptional({ description: 'Test timestamp', example: '2024-11-10T09:00:00.000Z' })
  testedAt: Date | null;

  @ApiPropertyOptional({ description: 'User ID who tested the sample', example: 'uuid' })
  testedBy: string | null;

  @ApiPropertyOptional({ description: 'Assignment UUID', example: 'uuid' })
  assignmentId: string | null;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-11-10T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2024-11-10T08:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ type: PatientNestedDto, description: 'Patient details' })
  patient: PatientNestedDto;

  @ApiProperty({ type: UserNestedDto, description: 'User who collected the sample' })
  collectedByUser: UserNestedDto;

  @ApiPropertyOptional({ type: UserNestedDto, description: 'User who tested the sample' })
  testedByUser: UserNestedDto | null;
}

export class RegisterBloodSampleResponseDto {
  @ApiProperty({ description: 'Blood sample UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Sample ID (BL-YYYYMMDD-XXXX)', example: 'BL-20241110-0001' })
  sampleId: string;

  @ApiProperty({ description: '6-digit passcode (shown only once)', example: '123456' })
  passcode: string;

  @ApiProperty({ description: 'Patient UUID', example: 'uuid' })
  patientId: string;

  @ApiProperty({ description: 'Collection timestamp', example: '2024-11-10T08:00:00.000Z' })
  collectedAt: Date;
}






