import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RegisterBloodSampleDto {
  @ApiProperty({
    description: 'Patient UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4', { message: 'Patient ID must be a valid UUID' })
  patientId: string;
}





