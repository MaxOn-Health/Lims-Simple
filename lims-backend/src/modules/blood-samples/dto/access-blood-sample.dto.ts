import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, Length } from 'class-validator';

export class AccessBloodSampleDto {
  @ApiProperty({
    description: 'Blood sample ID (BL-YYYYMMDD-XXXX)',
    example: 'BL-20241110-0001',
  })
  @IsString()
  @Matches(/^BL-\d{8}-\d{4}$/, {
    message: 'Sample ID must be in format BL-YYYYMMDD-XXXX',
  })
  sampleId: string;

  @ApiProperty({
    description: '6-digit passcode',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: 'Passcode must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Passcode must be a 6-digit number' })
  passcode: string;
}






