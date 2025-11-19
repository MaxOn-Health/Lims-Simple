import { IsUUID, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddTestToPackageDto {
  @ApiProperty({
    description: 'Test ID to add to package',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Test ID must be a valid UUID' })
  testId: string;

  @ApiPropertyOptional({
    description: 'Override price for this test in the package',
    example: 500.00,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Test price must have at most 2 decimal places' })
  @Min(0, { message: 'Test price must be a positive number' })
  testPrice?: number;
}

