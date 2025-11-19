import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Gender, isValidGender } from '../constants/gender.enum';

export function IsValidGender(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidGender',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return isValidGender(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid gender (${Object.values(Gender).join(', ')})`;
        },
      },
    });
  };
}

