import {
  IsString,
  IsInt,
  IsEnum,
  IsEmail,
  IsOptional,
  IsUUID,
  IsArray,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../constants/gender.enum';
import { IsValidGender } from '../validators/is-valid-gender.validator';
import { IsValidAddonTests } from '../validators/is-valid-addon-tests.validator';
import { IsValidContactNumber } from '../validators/is-valid-contact-number.validator';

export class CreatePatientDto {
  @ApiProperty({
    description: 'Patient full name',
    example: 'John Doe',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name: string;

  @ApiProperty({
    description: 'Patient age',
    example: 35,
    minimum: 1,
    maximum: 150,
  })
  @Type(() => Number)
  @IsInt({ message: 'Age must be an integer' })
  @Min(1, { message: 'Age must be a positive integer' })
  age: number;

  @ApiProperty({
    description: 'Patient gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsEnum(Gender, { message: 'Gender must be MALE, FEMALE, or OTHER' })
  @IsValidGender()
  gender: Gender;

  @ApiProperty({
    description: 'Contact number',
    example: '+1234567890',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20, { message: 'Contact number must not exceed 20 characters' })
  @IsValidContactNumber()
  contactNumber: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Employee ID',
    example: 'EMP001',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Employee ID must not exceed 100 characters' })
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'Acme Corporation',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Company name must not exceed 255 characters' })
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Address',
    example: '123 Main St, City, State 12345',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Project ID (for grouping patients by employer/camp)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Project ID must be a valid UUID' })
  projectId?: string;

  @ApiProperty({
    description: 'Package ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Package ID must be a valid UUID' })
  packageId: string;

  @ApiPropertyOptional({
    description: 'Array of addon test IDs',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'Each addon test ID must be a valid UUID' })
  @IsValidAddonTests()
  addonTestIds?: string[];
}

