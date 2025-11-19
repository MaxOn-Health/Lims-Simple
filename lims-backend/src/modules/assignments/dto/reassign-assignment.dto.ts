import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReassignAssignmentDto {
  @ApiProperty({
    description: 'Admin ID to reassign to',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  adminId: string;
}

