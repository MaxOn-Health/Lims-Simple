import { IsString, IsEnum, IsBoolean, IsArray, IsOptional, ValidateIf } from 'class-validator';
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
}

