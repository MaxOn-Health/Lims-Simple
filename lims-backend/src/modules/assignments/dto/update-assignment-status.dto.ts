import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AssignmentStatus } from '../constants/assignment-status.enum';

export class UpdateAssignmentStatusDto {
  @ApiProperty({
    description: 'New assignment status',
    enum: AssignmentStatus,
    example: AssignmentStatus.IN_PROGRESS,
  })
  @IsEnum(AssignmentStatus)
  status: AssignmentStatus;
}

