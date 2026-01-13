import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '../../assignments/constants/assignment-status.enum';

export class AssignmentInfoDto {
  @ApiProperty({ description: 'Assignment UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Patient ID', example: 'uuid' })
  patientId: string;

  @ApiProperty({ description: 'Test ID', example: 'uuid' })
  testId: string;

  @ApiPropertyOptional({ description: 'Admin ID', example: 'uuid' })
  adminId: string | null;

  @ApiProperty({ description: 'Assignment status', enum: AssignmentStatus, example: AssignmentStatus.SUBMITTED })
  status: AssignmentStatus;
}

export class TestInfoDto {
  @ApiProperty({ description: 'Test UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Test name', example: 'Blood Glucose Test' })
  name: string;

  @ApiProperty({ description: 'Test category', example: 'lab' })
  category: string;
}

export class PatientInfoDto {
  @ApiProperty({ description: 'Patient UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Patient ID', example: 'PAT-20241110-0001' })
  patientId: string;

  @ApiProperty({ description: 'Patient name', example: 'John Doe' })
  name: string;
}

export class UserInfoDto {
  @ApiProperty({ description: 'User UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'User email', example: 'admin@lims.com' })
  email: string;

  @ApiProperty({ description: 'User full name', example: 'John Admin' })
  fullName: string;
}

export class ResultResponseDto {
  @ApiProperty({ description: 'Result UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Assignment ID', example: 'uuid' })
  assignmentId: string;

  @ApiProperty({
    description: 'Result values',
    example: { result_value: 10.5, notes: 'Patient fasting' },
  })
  resultValues: Record<string, any>;

  @ApiPropertyOptional({ description: 'Notes', example: 'Patient was fasting before test' })
  notes: string | null;

  @ApiProperty({ description: 'Entered by user ID', example: 'uuid' })
  enteredBy: string;

  @ApiProperty({ description: 'Entered at timestamp', example: '2024-11-10T06:00:00.000Z' })
  enteredAt: Date;

  @ApiProperty({ description: 'Is verified', example: false })
  isVerified: boolean;

  @ApiPropertyOptional({ description: 'Verified by user ID', example: 'uuid' })
  verifiedBy: string | null;

  @ApiPropertyOptional({ description: 'Verified at timestamp', example: '2024-11-10T07:00:00.000Z' })
  verifiedAt: Date | null;

  @ApiProperty({ description: 'Created at timestamp', example: '2024-11-10T06:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp', example: '2024-11-10T06:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Assignment information', type: AssignmentInfoDto })
  assignment?: AssignmentInfoDto;

  @ApiPropertyOptional({ description: 'Test information', type: TestInfoDto })
  test?: TestInfoDto;

  @ApiPropertyOptional({ description: 'Patient information', type: PatientInfoDto })
  patient?: PatientInfoDto;

  @ApiPropertyOptional({ description: 'Entered by user information', type: UserInfoDto })
  enteredByUser?: UserInfoDto;

  @ApiPropertyOptional({ description: 'Verified by user information', type: UserInfoDto })
  verifiedByUser?: UserInfoDto | null;

  @ApiProperty({ description: 'Has been edited', example: false })
  isEdited: boolean;

  @ApiPropertyOptional({ description: 'Edited at timestamp', example: '2024-11-10T08:00:00.000Z' })
  editedAt: Date | null;

  @ApiPropertyOptional({ description: 'Edited by user ID', example: 'uuid' })
  editedBy: string | null;

  @ApiPropertyOptional({ description: 'Reason for editing', example: 'Fixed typo in result value' })
  editReason: string | null;

  @ApiPropertyOptional({
    description: 'Validation warnings (values outside normal range)',
    type: [String],
    example: ['result_value is outside normal range'],
  })
  warnings?: string[];
}






