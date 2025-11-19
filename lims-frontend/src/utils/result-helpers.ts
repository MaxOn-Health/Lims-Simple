import { ResultStatus } from '@/types/result.types';
import { Test, TestField, TestFieldType } from '@/types/test.types';

export type RangeStatus = 'normal' | 'warning' | 'abnormal';

/**
 * Check if a value is within the normal range
 */
export function checkNormalRange(
  value: number,
  min: number | null,
  max: number | null
): boolean {
  if (min === null && max === null) return true;
  if (min === null) return value <= max!;
  if (max === null) return value >= min;
  return value >= min && value <= max;
}

/**
 * Get the range status for a value (normal, warning, or abnormal)
 * Warning is when value is within 5% of the boundary
 */
export function getRangeStatus(
  value: number,
  min: number | null,
  max: number | null
): RangeStatus {
  if (min === null && max === null) return 'normal';
  
  if (min === null) {
    if (value > max!) return 'abnormal';
    const range = max!;
    const threshold = range * 0.05; // 5% threshold
    if (value >= max! - threshold) return 'warning';
    return 'normal';
  }
  
  if (max === null) {
    if (value < min) return 'abnormal';
    const range = min;
    const threshold = Math.abs(range * 0.05); // 5% threshold
    if (value <= min + threshold) return 'warning';
    return 'normal';
  }
  
  if (value < min || value > max) return 'abnormal';
  
  const range = max - min;
  const threshold = range * 0.05; // 5% threshold
  
  if (value <= min + threshold || value >= max - threshold) {
    return 'warning';
  }
  
  return 'normal';
}

/**
 * Calculate overall result status (NORMAL or ABNORMAL) based on all number field values
 */
export function calculateResultStatus(
  resultValues: Record<string, any>,
  test: Test
): ResultStatus {
  if (!test.normalRangeMin && !test.normalRangeMax) {
    // No normal range defined, consider as normal
    return 'NORMAL';
  }

  // Check all number fields against normal range
  for (const field of test.testFields) {
    if (field.field_type === TestFieldType.NUMBER) {
      const value = resultValues[field.field_name];
      if (value !== undefined && value !== null) {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numValue)) {
          const isNormal = checkNormalRange(
            numValue,
            test.normalRangeMin,
            test.normalRangeMax
          );
          if (!isNormal) {
            return 'ABNORMAL';
          }
        }
      }
    }
  }

  return 'NORMAL';
}

/**
 * Format a result value for display based on field type
 */
export function formatResultValue(value: any, fieldType: TestFieldType): string {
  if (value === null || value === undefined) return '—';

  switch (fieldType) {
    case TestFieldType.NUMBER:
      return typeof value === 'number' ? value.toString() : parseFloat(value).toString();
    
    case TestFieldType.BOOLEAN:
      return value ? 'Yes' : 'No';
    
    case TestFieldType.DATE:
      if (typeof value === 'string') {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      if (value instanceof Date) {
        return value.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      return String(value);
    
    case TestFieldType.SELECT:
    case TestFieldType.TEXT:
    case TestFieldType.FILE:
    default:
      return String(value);
  }
}

/**
 * Get the display label for a field name (convert snake_case to Title Case)
 */
export function getFieldLabel(fieldName: string): string {
  return fieldName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a result has any abnormal values
 */
export function hasAbnormalValues(resultValues: Record<string, any>, test: Test): boolean {
  return calculateResultStatus(resultValues, test) === 'ABNORMAL';
}

/**
 * Get all abnormal field values
 */
export function getAbnormalFields(
  resultValues: Record<string, any>,
  test: Test
): Array<{ fieldName: string; value: any }> {
  const abnormalFields: Array<{ fieldName: string; value: any }> = [];

  if (!test.normalRangeMin && !test.normalRangeMax) {
    return abnormalFields;
  }

  for (const field of test.testFields) {
    if (field.field_type === TestFieldType.NUMBER) {
      const value = resultValues[field.field_name];
      if (value !== undefined && value !== null) {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numValue)) {
          const isNormal = checkNormalRange(
            numValue,
            test.normalRangeMin,
            test.normalRangeMax
          );
          if (!isNormal) {
            abnormalFields.push({ fieldName: field.field_name, value });
          }
        }
      }
    }
  }

  return abnormalFields;
}

