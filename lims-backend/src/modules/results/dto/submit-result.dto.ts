import { IsUUID, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitResultDto {
  @ApiProperty({
    description: 'Assignment ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  assignmentId: string;

  @ApiProperty({
    description: 'Result values matching test field definitions',
    example: {
      result_value: 10.5,
      notes: 'Patient fasting',
    },
  })
  @IsObject()
  resultValues: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Patient was fasting before test',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}






