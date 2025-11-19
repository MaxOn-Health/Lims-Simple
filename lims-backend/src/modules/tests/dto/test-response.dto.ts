import { ApiProperty } from '@nestjs/swagger';
import { TestCategory } from '../constants/test-category';
import { TestFieldDto } from './test-field.dto';

export class TestResponseDto {
  @ApiProperty({
    description: 'Test ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Test name',
    example: 'Complete Blood Count',
  })
  name: string;

  @ApiProperty({
    description: 'Test description',
    example: 'A complete blood count test',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Test category',
    enum: TestCategory,
    example: TestCategory.LAB,
  })
  category: TestCategory;

  @ApiProperty({
    description: 'Admin role that handles this test',
    example: 'audiometry',
  })
  adminRole: string;

  @ApiProperty({
    description: 'Normal range minimum value',
    example: 4.5,
    nullable: true,
  })
  normalRangeMin: number | null;

  @ApiProperty({
    description: 'Normal range maximum value',
    example: 11.0,
    nullable: true,
  })
  normalRangeMax: number | null;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'g/dL',
    nullable: true,
  })
  unit: string | null;

  @ApiProperty({
    description: 'Test fields definition',
    type: [TestFieldDto],
  })
  testFields: TestFieldDto[];

  @ApiProperty({
    description: 'Test active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

