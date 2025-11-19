import { ApiProperty } from '@nestjs/swagger';

export class PackageTestResponseDto {
  @ApiProperty({
    description: 'Package test ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Test ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  testId: string;

  @ApiProperty({
    description: 'Test name',
    example: 'Blood Test',
  })
  testName: string;

  @ApiProperty({
    description: 'Override price for this test',
    example: 500.00,
    nullable: true,
  })
  testPrice: number | null;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}

export class PackageResponseDto {
  @ApiProperty({
    description: 'Package ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Package name',
    example: 'Basic Health Package',
  })
  name: string;

  @ApiProperty({
    description: 'Package description',
    example: 'A comprehensive health checkup package',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Package price',
    example: 1500.00,
  })
  price: number;

  @ApiProperty({
    description: 'Validity period in days',
    example: 365,
  })
  validityDays: number;

  @ApiProperty({
    description: 'Package active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Tests in this package',
    type: [PackageTestResponseDto],
  })
  tests: PackageTestResponseDto[];

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

