import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TestCategory } from '../constants/test-category';
import { IsValidTestCategory } from '../validators/is-valid-test-category.validator';

export class QueryTestsDto {
  @ApiPropertyOptional({
    description: 'Filter by test category',
    enum: TestCategory,
    example: TestCategory.LAB,
  })
  @IsOptional()
  @IsEnum(TestCategory, { message: 'Category must be either on_site or lab' })
  @IsValidTestCategory()
  category?: TestCategory;

  @ApiPropertyOptional({
    description: 'Filter by admin role',
    example: 'audiometry',
  })
  @IsOptional()
  @IsString()
  adminRole?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

