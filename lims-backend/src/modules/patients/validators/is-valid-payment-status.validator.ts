import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { PaymentStatus, isValidPaymentStatus } from '../constants/payment-status.enum';

export function IsValidPaymentStatus(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidPaymentStatus',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return isValidPaymentStatus(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid payment status (${Object.values(PaymentStatus).join(', ')})`;
        },
      },
    });
  };
}

