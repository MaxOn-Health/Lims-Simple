import { IsString, IsEnum, IsBoolean, IsArray, IsOptional, ValidateIf, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TestFieldType } from '../constants/test-field-types';

export class TestFieldDto {
  @ApiProperty({
    description: 'Field name',
    example: 'result_value',
  })
  @IsString()
  field_name: string;

  @ApiProperty({
    description: 'Field type',
    enum: TestFieldType,
    example: TestFieldType.NUMBER,
  })
  @IsEnum(TestFieldType)
  field_type: TestFieldType;

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
  })
  @IsBoolean()
  required: boolean;

  @ApiProperty({
    description: 'Options for select type (null for other types)',
    example: ['Option 1', 'Option 2'],
    nullable: true,
  })
  @ValidateIf((o) => o.field_type === TestFieldType.SELECT)
  @IsArray()
  @IsString({ each: true })
  @ValidateIf((o) => o.field_type !== TestFieldType.SELECT)
  @IsOptional()
  options: string[] | null;

  @ApiProperty({
    description: 'Unit of measurement for this field',
    example: 'gm/dL',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string | null;

  @ApiProperty({
    description: 'Minimum value of normal range',
    example: 11.0,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  normalRangeMin?: number | null;

  @ApiProperty({
    description: 'Maximum value of normal range',
    example: 16.0,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  normalRangeMax?: number | null;
}

