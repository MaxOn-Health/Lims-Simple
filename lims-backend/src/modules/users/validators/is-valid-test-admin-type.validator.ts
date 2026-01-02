import {
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/**
 * Validates that the admin role is a valid format.
 * Actual existence check is done at the service layer against the database.
 * Format: lowercase, starts with letter, contains only letters, numbers, and underscores
 */
export function IsValidTestAdminType(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidTestAdminType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string' || value.length === 0) {
            return false;
          }
          // Validate format: lowercase, starts with letter, alphanumeric + underscores
          return /^[a-z][a-z0-9_]*$/.test(value);
        },
        defaultMessage() {
          return 'Invalid admin role format. Must be lowercase, start with a letter, and contain only letters, numbers, and underscores.';
        },
      },
    });
  };
}

