import {
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { isValidTestCategory } from '../constants/test-category';

export function IsValidTestCategory(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidTestCategory',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') {
            return false;
          }
          return isValidTestCategory(value);
        },
        defaultMessage() {
          return 'Invalid test category. Allowed values: on_site, lab';
        },
      },
    });
  };
}

