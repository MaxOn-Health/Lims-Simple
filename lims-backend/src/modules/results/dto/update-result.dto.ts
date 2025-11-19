import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateResultDto {
  @ApiPropertyOptional({
    description: 'Updated result values matching test field definitions',
    example: {
      result_value: 11.0,
      notes: 'Updated after review',
    },
  })
  @IsOptional()
  @IsObject()
  resultValues?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Updated notes',
    example: 'Corrected after verification',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}





