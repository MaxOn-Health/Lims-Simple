import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '../constants/assignment-status.enum';

export class PatientInfoDto {
  @ApiProperty({ description: 'Patient UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Patient ID', example: 'PAT-20241110-0001' })
  patientId: string;

  @ApiProperty({ description: 'Patient name', example: 'John Doe' })
  name: string;

  @ApiPropertyOptional({ description: 'Employee ID', example: 'EMP001' })
  employeeId: string | null;

  @ApiPropertyOptional({ description: 'Company name', example: 'Acme Corp' })
  companyName: string | null;
}

export class TestInfoDto {
  @ApiProperty({ description: 'Test UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Test name', example: 'Blood Glucose Test' })
  name: string;

  @ApiProperty({ description: 'Test category', example: 'lab' })
  category: string;

  @ApiProperty({ description: 'Admin role required', example: 'audiometry' })
  adminRole: string;
}

export class AdminInfoDto {
  @ApiProperty({ description: 'Admin UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Admin email', example: 'admin@lims.com' })
  email: string;

  @ApiProperty({ description: 'Admin full name', example: 'John Admin' })
  fullName: string;

  @ApiProperty({ description: 'Test technician type', example: 'audiometry' })
  testTechnicianType: string | null;
}

export class AssignmentResponseDto {
  @ApiProperty({ description: 'Assignment UUID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Patient ID', example: 'uuid' })
  patientId: string;

  @ApiProperty({ description: 'Test ID', example: 'uuid' })
  testId: string;

  @ApiPropertyOptional({ description: 'Admin ID', example: 'uuid' })
  adminId: string | null;

  @ApiProperty({ description: 'Assignment status', enum: AssignmentStatus, example: AssignmentStatus.ASSIGNED })
  status: AssignmentStatus;

  @ApiPropertyOptional({ description: 'Assigned at timestamp', example: '2024-11-10T06:00:00.000Z' })
  assignedAt: Date | null;

  @ApiPropertyOptional({ description: 'Started at timestamp', example: '2024-11-10T07:00:00.000Z' })
  startedAt: Date | null;

  @ApiPropertyOptional({ description: 'Completed at timestamp', example: '2024-11-10T08:00:00.000Z' })
  completedAt: Date | null;

  @ApiPropertyOptional({ description: 'Assigned by user ID', example: 'uuid' })
  assignedBy: string | null;

  @ApiProperty({ description: 'Created at timestamp', example: '2024-11-10T06:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at timestamp', example: '2024-11-10T06:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Patient information', type: PatientInfoDto })
  patient?: PatientInfoDto;

  @ApiPropertyOptional({ description: 'Test information', type: TestInfoDto })
  test?: TestInfoDto;

  @ApiPropertyOptional({ description: 'Admin information', type: AdminInfoDto })
  admin?: AdminInfoDto | null;
}

