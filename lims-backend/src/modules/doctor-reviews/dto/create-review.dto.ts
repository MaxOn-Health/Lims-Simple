import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ description: 'Patient ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'Doctor remarks', example: 'All results within normal range' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remarks?: string;
}
