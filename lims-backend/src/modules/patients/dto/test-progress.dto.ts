import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus } from '../../assignments/constants/assignment-status.enum';

export class TestProgressDto {
  @ApiProperty({ description: 'Test ID', example: 'uuid' })
  testId: string;

  @ApiProperty({ description: 'Test name', example: 'X-Ray' })
  testName: string;

  @ApiPropertyOptional({ description: 'Assignment ID if assigned', example: 'uuid' })
  assignmentId?: string | null;

  @ApiPropertyOptional({ 
    description: 'Assignment status', 
    enum: AssignmentStatus,
    example: AssignmentStatus.ASSIGNED 
  })
  assignmentStatus?: AssignmentStatus | null;

  @ApiProperty({ description: 'Whether test result exists', example: true })
  hasResult: boolean;

  @ApiProperty({ description: 'Whether this test is missing (not assigned or not completed)', example: false })
  isMissing: boolean;
}

