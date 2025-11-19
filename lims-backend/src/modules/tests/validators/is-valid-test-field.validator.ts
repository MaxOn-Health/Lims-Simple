import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { isValidTestFieldType, TestFieldType } from '../constants/test-field-types';
import { TestFieldDto } from '../dto/test-field.dto';

export function IsValidTestField(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidTestField',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!Array.isArray(value)) {
            return false;
          }

          if (value.length === 0) {
            return false;
          }

          for (const field of value) {
            // Validate field structure
            if (!field || typeof field !== 'object') {
              return false;
            }

            // Check required fields
            if (!field.field_name || typeof field.field_name !== 'string') {
              return false;
            }

            if (!field.field_type || typeof field.field_type !== 'string') {
              return false;
            }

            if (!isValidTestFieldType(field.field_type)) {
              return false;
            }

            if (typeof field.required !== 'boolean') {
              return false;
            }

            // Validate options based on field_type
            if (field.field_type === TestFieldType.SELECT) {
              if (!Array.isArray(field.options) || field.options.length === 0) {
                return false;
              }
              // Check all options are strings
              if (!field.options.every((opt: any) => typeof opt === 'string')) {
                return false;
              }
            } else {
              // For non-select types, options should be null
              if (field.options !== null && field.options !== undefined) {
                return false;
              }
            }
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Invalid test fields structure. Each field must have field_name (string), field_type (valid enum), required (boolean), and options (array for select type, null otherwise)';
        },
      },
    });
  };
}

