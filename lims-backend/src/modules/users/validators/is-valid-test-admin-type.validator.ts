import {
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { isValidTestAdminType } from '../constants/test-admin-types';

export function IsValidTestAdminType(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidTestAdminType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') {
            return false;
          }
          return isValidTestAdminType(value);
        },
        defaultMessage() {
          return 'Invalid test technician type. Allowed values: audiometry, xray, eye_test, pft, ecg';
        },
      },
    });
  };
}

