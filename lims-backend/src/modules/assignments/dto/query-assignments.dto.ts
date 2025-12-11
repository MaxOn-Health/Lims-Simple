import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '../constants/assignment-status.enum';

export class QueryAssignmentsDto {
  @ApiPropertyOptional({
    description: 'Filter by assignment status',
    enum: AssignmentStatus,
    example: AssignmentStatus.ASSIGNED,
  })
  @IsOptional()
  @IsEnum(AssignmentStatus)
  status?: AssignmentStatus;

  @ApiPropertyOptional({
    description: 'Filter by patient ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({
    description: 'Filter by admin ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  adminId?: string;

  @ApiPropertyOptional({
    description: 'Filter by test ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  testId?: string;

  @ApiPropertyOptional({
    description: 'Filter by project ID',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}

