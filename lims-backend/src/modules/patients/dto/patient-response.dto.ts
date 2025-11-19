import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../constants/gender.enum';
import { PaymentStatus } from '../constants/payment-status.enum';

export class PatientPackageResponseDto {
  @ApiProperty({ description: 'Patient package ID', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Package ID', example: 'uuid' })
  packageId: string;

  @ApiProperty({ description: 'Package name', example: 'Basic Health Package' })
  packageName: string;

  @ApiProperty({ type: [String], description: 'Addon test IDs', example: ['uuid1', 'uuid2'] })
  addonTestIds: string[];

  @ApiProperty({ description: 'Total price', example: 2500.00 })
  totalPrice: number;

  @ApiProperty({ description: 'Payment status', enum: PaymentStatus, example: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @ApiProperty({ description: 'Payment amount', example: 0.00 })
  paymentAmount: number;

  @ApiProperty({ description: 'Registered by user ID', example: 'uuid' })
  registeredBy: string;

  @ApiProperty({ description: 'Registration date', example: '2024-11-10T06:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2024-11-10T06:00:00.000Z' })
  updatedAt: Date;
}

export class PatientResponseDto {
  @ApiProperty({ description: 'Patient UUID', example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' })
  id: string;

  @ApiProperty({ description: 'Patient ID (PAT-YYYYMMDD-XXXX)', example: 'PAT-20241110-0001' })
  patientId: string;

  @ApiProperty({ description: 'Patient name', example: 'John Doe' })
  name: string;

  @ApiProperty({ description: 'Patient age', example: 35 })
  age: number;

  @ApiProperty({ description: 'Patient gender', enum: Gender, example: Gender.MALE })
  gender: Gender;

  @ApiProperty({ description: 'Contact number', example: '+1234567890' })
  contactNumber: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'john.doe@example.com' })
  email: string | null;

  @ApiPropertyOptional({ description: 'Employee ID', example: 'EMP001' })
  employeeId: string | null;

  @ApiPropertyOptional({ description: 'Company name', example: 'Acme Corporation' })
  companyName: string | null;

  @ApiPropertyOptional({ description: 'Address', example: '123 Main St, City, State 12345' })
  address: string | null;

  @ApiPropertyOptional({ description: 'Project ID (for grouping patients by employer/camp)', example: '123e4567-e89b-12d3-a456-426614174000' })
  projectId: string | null;

  @ApiProperty({ description: 'Registration date', example: '2024-11-10T06:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date', example: '2024-11-10T06:00:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({
    type: [PatientPackageResponseDto],
    description: 'Patient packages',
  })
  patientPackages?: PatientPackageResponseDto[];
}

