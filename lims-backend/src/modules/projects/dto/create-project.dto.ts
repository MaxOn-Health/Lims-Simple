import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsUUID,
  IsObject,
  ValidateNested,
  MaxLength,
  Matches,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CampSettingsDto {
  @ApiPropertyOptional({
    description: 'Auto-generate patient IDs',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoGeneratePatientIds?: boolean;

  @ApiPropertyOptional({
    description: 'Patient ID prefix',
    example: 'CAMP2025',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Patient ID prefix must not exceed 20 characters' })
  patientIdPrefix?: string;

  @ApiPropertyOptional({
    description: 'Require employee ID for patients',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requireEmployeeId?: boolean;

  @ApiPropertyOptional({
    description: 'Default package ID for the project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  defaultPackageId?: string;
}

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'TechCorp Annual Health Camp 2025',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;

  @ApiProperty({
    description: 'Project description',
    example: 'Annual health camp for TechCorp employees',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description: string;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'TechCorp India Pvt Ltd',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Company name must not exceed 255 characters' })
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Contact person name',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Contact person must not exceed 100 characters' })
  contactPerson?: string;

  @ApiPropertyOptional({
    description: 'Contact number',
    example: '+91-9876543210',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Contact number must not exceed 20 characters' })
  contactNumber?: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'contact@techcorp.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Camp date',
    example: '2025-12-20',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Invalid date format. Use YYYY-MM-DD' })
  campDate?: string;

  @ApiPropertyOptional({
    description: 'Camp location',
    example: 'TechCorp HQ, Bangalore',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Camp location must not exceed 255 characters' })
  campLocation?: string;

  @ApiPropertyOptional({
    description: 'Camp settings',
    type: CampSettingsDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CampSettingsDto)
  campSettings?: CampSettingsDto;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Special arrangements for elderly employees',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

