import {
  IsString,
  IsEnum,
  IsNumber,
  IsArray,
  IsBoolean,
  IsOptional,
  ValidateNested,
  ValidateIf,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TestCategory } from '../constants/test-category';
import { TestFieldType } from '../constants/test-field-types';
import { IsValidTestAdminType } from '../../users/validators/is-valid-test-admin-type.validator';
import { IsValidTestField } from '../validators/is-valid-test-field.validator';
import { IsValidTestCategory } from '../validators/is-valid-test-category.validator';
import { TestFieldDto } from './test-field.dto';

export class CreateTestDto {
  @ApiProperty({
    description: 'Test name',
    example: 'Complete Blood Count',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Test description',
    example: 'A complete blood count test to measure various components of blood',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Test category',
    enum: TestCategory,
    example: TestCategory.LAB,
  })
  @IsEnum(TestCategory, { message: 'Category must be either on_site or lab' })
  @IsValidTestCategory()
  category: TestCategory;

  @ApiProperty({
    description: 'Admin role that handles this test',
    example: 'audiometry',
  })
  @IsString()
  @IsValidTestAdminType({ message: 'Invalid admin role specified' })
  adminRole: string;

  @ApiProperty({
    description: 'Test fields definition',
    type: [TestFieldDto],
    example: [
      {
        field_name: 'result_value',
        field_type: 'number',
        required: true,
        options: null,
      },
      {
        field_name: 'notes',
        field_type: 'text',
        required: false,
        options: null,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestFieldDto)
  @IsValidTestField()
  testFields: TestFieldDto[];
}

