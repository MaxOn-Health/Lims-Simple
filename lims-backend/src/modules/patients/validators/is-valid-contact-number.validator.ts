import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsValidContactNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidContactNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') {
            return false;
          }
          // Allow alphanumeric, spaces, hyphens, parentheses, plus sign
          // Common formats: +1234567890, (123) 456-7890, 123-456-7890, etc.
          const contactRegex = /^[\d\s\-\+\(\)]+$/;
          return contactRegex.test(value) && value.length >= 7 && value.length <= 20;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid contact number (7-20 characters, alphanumeric, spaces, hyphens, parentheses, plus sign allowed)`;
        },
      },
    });
  };
}

