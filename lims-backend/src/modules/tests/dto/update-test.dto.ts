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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TestCategory } from '../constants/test-category';
import { IsValidTestAdminType } from '../../users/validators/is-valid-test-admin-type.validator';
import { IsValidTestField } from '../validators/is-valid-test-field.validator';
import { IsValidTestCategory } from '../validators/is-valid-test-category.validator';
import { TestFieldDto } from './test-field.dto';

export class UpdateTestDto {
  @ApiPropertyOptional({
    description: 'Test name',
    example: 'Updated Test Name',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Test description',
    example: 'Updated description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Test category',
    enum: TestCategory,
    example: TestCategory.ON_SITE,
  })
  @IsOptional()
  @IsEnum(TestCategory, { message: 'Category must be either on_site or lab' })
  @IsValidTestCategory()
  category?: TestCategory;

  @ApiPropertyOptional({
    description: 'Admin role that handles this test',
    example: 'xray',
  })
  @IsOptional()
  @IsString()
  @IsValidTestAdminType({ message: 'Invalid admin role specified' })
  adminRole?: string;

  @ApiPropertyOptional({
    description: 'Normal range minimum value',
    example: 4.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Normal range min must have at most 2 decimal places' })
  normalRangeMin?: number;

  @ApiPropertyOptional({
    description: 'Normal range maximum value',
    example: 11.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Normal range max must have at most 2 decimal places' })
  @ValidateIf((o) => o.normalRangeMin !== undefined && o.normalRangeMax !== undefined)
  @Min(0, { message: 'Normal range max must be greater than min' })
  normalRangeMax?: number;

  @ApiPropertyOptional({
    description: 'Unit of measurement',
    example: 'g/dL',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Unit must not exceed 50 characters' })
  unit?: string;

  @ApiPropertyOptional({
    description: 'Test fields definition',
    type: [TestFieldDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestFieldDto)
  @IsValidTestField()
  testFields?: TestFieldDto[];

  @ApiPropertyOptional({
    description: 'Test active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

