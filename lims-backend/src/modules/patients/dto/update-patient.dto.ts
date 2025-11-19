import {
  IsString,
  IsInt,
  IsEnum,
  IsEmail,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '../constants/gender.enum';
import { IsValidGender } from '../validators/is-valid-gender.validator';
import { IsValidContactNumber } from '../validators/is-valid-contact-number.validator';

export class UpdatePatientDto {
  @ApiPropertyOptional({
    description: 'Patient full name',
    example: 'John Doe Updated',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Patient age',
    example: 36,
    minimum: 1,
    maximum: 150,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Age must be an integer' })
  @Min(1, { message: 'Age must be a positive integer' })
  age?: number;

  @ApiPropertyOptional({
    description: 'Patient gender',
    enum: Gender,
    example: Gender.FEMALE,
  })
  @IsOptional()
  @IsEnum(Gender, { message: 'Gender must be MALE, FEMALE, or OTHER' })
  @IsValidGender()
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Contact number',
    example: '+1234567890',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Contact number must not exceed 20 characters' })
  @IsValidContactNumber()
  contactNumber?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe.updated@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Employee ID',
    example: 'EMP002',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Employee ID must not exceed 100 characters' })
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'Updated Company Name',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Company name must not exceed 255 characters' })
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Address',
    example: '456 New St, City, State 12345',
  })
  @IsOptional()
  @IsString()
  address?: string;
}

