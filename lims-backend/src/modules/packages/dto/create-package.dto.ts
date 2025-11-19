import {
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePackageDto {
  @ApiProperty({
    description: 'Package name',
    example: 'Basic Health Package',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name: string;

  @ApiPropertyOptional({
    description: 'Package description',
    example: 'A comprehensive health checkup package',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Package price',
    example: 1500.00,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must have at most 2 decimal places' })
  @Min(0, { message: 'Price must be a positive number' })
  price: number;

  @ApiPropertyOptional({
    description: 'Validity period in days',
    example: 365,
    default: 365,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Validity days must be an integer' })
  @Min(1, { message: 'Validity days must be a positive integer' })
  validityDays?: number = 365;
}

