import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
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
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return undefined;
  })
  @Type(() => Boolean)
  @IsBoolean({ message: 'isActive must be a boolean value' })
  isActive?: boolean;
}

