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

