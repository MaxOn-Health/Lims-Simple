import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitBloodTestResultDto {
  @ApiProperty({
    description: 'JSON object containing the result values, matching the test field definitions',
    example: { hemoglobin: 14.5, hematocrit: 42.0 },
  })
  @IsObject({ message: 'Result values must be a valid JSON object' })
  resultValues: Record<string, any>;

  @ApiPropertyOptional({ description: 'Optional notes for the test result', example: 'Sample collected in fasting state' })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Notes must not exceed 1000 characters' })
  notes?: string;
}





