import { IsObject, IsOptional, IsString, IsNotEmpty, MaxLength } from 'class-validator';
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

  @ApiPropertyOptional({
    description: 'Reason for editing the result (required when editing)',
    example: 'Fixed typo in the result value',
  })
  @IsString()
  @IsNotEmpty({ message: 'Edit reason is required when editing a result' })
  @MaxLength(500, { message: 'Edit reason must not exceed 500 characters' })
  editReason?: string;
}






