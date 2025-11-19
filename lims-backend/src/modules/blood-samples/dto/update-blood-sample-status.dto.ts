import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { BloodSampleStatus } from '../constants/blood-sample-status.enum';

export class UpdateBloodSampleStatusDto {
  @ApiProperty({
    description: 'New status for the blood sample',
    enum: BloodSampleStatus,
    example: BloodSampleStatus.IN_LAB,
  })
  @IsEnum(BloodSampleStatus, {
    message: 'Status must be one of: COLLECTED, IN_LAB, TESTED, COMPLETED',
  })
  status: BloodSampleStatus;
}





