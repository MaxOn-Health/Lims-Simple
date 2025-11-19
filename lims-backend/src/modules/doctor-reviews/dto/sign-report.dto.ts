import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsObject } from 'class-validator';

export class SignReportDto {
  @ApiProperty({ description: 'Patient ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  patientId: string;

  @ApiProperty({
    description: 'WebAuthn passkey credential response',
    example: {
      id: 'credential-id',
      rawId: 'base64-encoded-raw-id',
      response: {
        authenticatorData: 'base64-encoded-data',
        clientDataJSON: 'base64-encoded-data',
        signature: 'base64-encoded-signature',
        userHandle: null,
      },
      type: 'public-key',
    },
  })
  @IsObject()
  passkeyCredential: any;
}
