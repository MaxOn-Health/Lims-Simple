import { Injectable } from '@nestjs/common';
import { TestField } from '../../tests/entities/test.entity';
import { TestFieldType } from '../../tests/constants/test-field-types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class ResultValidationService {
  validateResultValues(
    testFields: TestField[],
    resultValues: Record<string, any>,
    normalRangeMin?: number | null,
    normalRangeMax?: number | null,
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if resultValues is an object
    if (!resultValues || typeof resultValues !== 'object' || Array.isArray(resultValues)) {
      errors.push('result_values must be an object');
      return { isValid: false, errors, warnings };
    }

    // Check all required fields are present
    for (const field of testFields) {
      if (field.required && !(field.field_name in resultValues)) {
        errors.push(`Required field '${field.field_name}' is missing`);
      }
    }

    // Validate each field in resultValues
    for (const [fieldName, fieldValue] of Object.entries(resultValues)) {
      const fieldDef = testFields.find((f) => f.field_name === fieldName);

      if (!fieldDef) {
        errors.push(`Unknown field '${fieldName}' - not defined in test fields`);
        continue;
      }

      // Validate field type
      const typeError = this.validateFieldType(fieldName, fieldValue, fieldDef.field_type, fieldDef.options);
      if (typeError) {
        errors.push(typeError);
        continue;
      }

      // Validate normal range for number fields
      if (
        fieldDef.field_type === TestFieldType.NUMBER &&
        typeof fieldValue === 'number' &&
        (normalRangeMin !== null && normalRangeMin !== undefined) &&
        (normalRangeMax !== null && normalRangeMax !== undefined)
      ) {
        if (fieldValue < normalRangeMin || fieldValue > normalRangeMax) {
          warnings.push(
            `Field '${fieldName}' value ${fieldValue} is outside normal range (${normalRangeMin} - ${normalRangeMax})`,
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateFieldType(
    fieldName: string,
    value: any,
    expectedType: TestFieldType,
    options: string[] | null,
  ): string | null {
    switch (expectedType) {
      case TestFieldType.NUMBER:
        if (typeof value !== 'number' || isNaN(value)) {
          return `Field '${fieldName}' must be a number`;
        }
        break;

      case TestFieldType.TEXT:
        if (typeof value !== 'string') {
          return `Field '${fieldName}' must be a string`;
        }
        break;

      case TestFieldType.BOOLEAN:
        if (typeof value !== 'boolean') {
          return `Field '${fieldName}' must be a boolean`;
        }
        break;

      case TestFieldType.SELECT:
        if (!options || options.length === 0) {
          return `Field '${fieldName}' is a select type but has no options defined`;
        }
        if (typeof value !== 'string') {
          return `Field '${fieldName}' must be a string for select type`;
        }
        if (!options.includes(value)) {
          return `Field '${fieldName}' value '${value}' is not in allowed options: ${options.join(', ')}`;
        }
        break;

      case TestFieldType.DATE:
        if (typeof value !== 'string') {
          return `Field '${fieldName}' must be a string (ISO date format)`;
        }
        // Validate ISO date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
        if (!dateRegex.test(value) && isNaN(Date.parse(value))) {
          return `Field '${fieldName}' must be a valid date string (ISO format)`;
        }
        break;

      case TestFieldType.FILE:
        if (typeof value !== 'string') {
          return `Field '${fieldName}' must be a string (file path/URL)`;
        }
        break;

      default:
        return `Unknown field type '${expectedType}' for field '${fieldName}'`;
    }

    return null;
  }
}

