import { IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../constants/payment-status.enum';
import { IsValidPaymentStatus } from '../validators/is-valid-payment-status.validator';

export class UpdatePaymentDto {
  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  @IsEnum(PaymentStatus, { message: 'Payment status must be PENDING, PAID, or PARTIAL' })
  @IsValidPaymentStatus()
  paymentStatus: PaymentStatus;

  @ApiProperty({
    description: 'Payment amount',
    example: 1500.00,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Payment amount must have at most 2 decimal places' })
  @Min(0, { message: 'Payment amount must be a positive number' })
  paymentAmount: number;
}

