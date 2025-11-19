import { Test, TestingModule } from '@nestjs/testing';
import { ResultValidationService } from './result-validation.service';
import { TestField } from '../../tests/entities/test.entity';
import { TestFieldType } from '../../tests/constants/test-field-types';

describe('ResultValidationService', () => {
  let service: ResultValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResultValidationService],
    }).compile();

    service = module.get<ResultValidationService>(ResultValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateResultValues', () => {
    const testFields: TestField[] = [
      {
        field_name: 'result_value',
        field_type: TestFieldType.NUMBER,
        required: true,
        options: null,
      },
      {
        field_name: 'notes',
        field_type: TestFieldType.TEXT,
        required: false,
        options: null,
      },
      {
        field_name: 'status',
        field_type: TestFieldType.SELECT,
        required: true,
        options: ['positive', 'negative', 'inconclusive'],
      },
    ];

    it('should validate correct result values', () => {
      const resultValues = {
        result_value: 10.5,
        notes: 'Patient fasting',
        status: 'positive',
      };

      const result = service.validateResultValues(testFields, resultValues, 5.0, 15.0);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return error for missing required field', () => {
      const resultValues = {
        notes: 'Patient fasting',
      };

      const result = service.validateResultValues(testFields, resultValues);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Required field 'result_value' is missing");
      expect(result.errors).toContain("Required field 'status' is missing");
    });

    it('should return error for unknown field', () => {
      const resultValues = {
        result_value: 10.5,
        unknown_field: 'value',
      };

      const result = service.validateResultValues(testFields, resultValues);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Unknown field 'unknown_field' - not defined in test fields");
    });

    it('should validate number type', () => {
      const resultValues = {
        result_value: 'not a number',
        status: 'positive',
      };

      const result = service.validateResultValues(testFields, resultValues);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'result_value' must be a number");
    });

    it('should validate text type', () => {
      const resultValues = {
        result_value: 10.5,
        notes: 123, // Should be string
        status: 'positive',
      };

      const result = service.validateResultValues(testFields, resultValues);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'notes' must be a string");
    });

    it('should validate select type with valid option', () => {
      const resultValues = {
        result_value: 10.5,
        status: 'positive',
      };

      const result = service.validateResultValues(testFields, resultValues);

      expect(result.isValid).toBe(true);
    });

    it('should return error for invalid select option', () => {
      const resultValues = {
        result_value: 10.5,
        status: 'invalid_option',
      };

      const result = service.validateResultValues(testFields, resultValues);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("Field 'status' value 'invalid_option' is not in allowed options"))).toBe(true);
    });

    it('should validate boolean type', () => {
      const booleanFields: TestField[] = [
        {
          field_name: 'is_positive',
          field_type: TestFieldType.BOOLEAN,
          required: true,
          options: null,
        },
      ];

      const resultValues = {
        is_positive: true,
      };

      const result = service.validateResultValues(booleanFields, resultValues);

      expect(result.isValid).toBe(true);
    });

    it('should return error for invalid boolean type', () => {
      const booleanFields: TestField[] = [
        {
          field_name: 'is_positive',
          field_type: TestFieldType.BOOLEAN,
          required: true,
          options: null,
        },
      ];

      const resultValues = {
        is_positive: 'true', // Should be boolean, not string
      };

      const result = service.validateResultValues(booleanFields, resultValues);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'is_positive' must be a boolean");
    });

    it('should validate date type', () => {
      const dateFields: TestField[] = [
        {
          field_name: 'test_date',
          field_type: TestFieldType.DATE,
          required: true,
          options: null,
        },
      ];

      const resultValues = {
        test_date: '2024-11-10T10:00:00Z',
      };

      const result = service.validateResultValues(dateFields, resultValues);

      expect(result.isValid).toBe(true);
    });

    it('should return warning for value outside normal range', () => {
      const resultValues = {
        result_value: 20.0, // Outside range 5.0-15.0
        status: 'positive',
      };

      const result = service.validateResultValues(testFields, resultValues, 5.0, 15.0);

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('outside normal range');
    });

    it('should not check normal range if not provided', () => {
      const resultValues = {
        result_value: 20.0,
        status: 'positive',
      };

      const result = service.validateResultValues(testFields, resultValues);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return error if resultValues is not an object', () => {
      const result = service.validateResultValues(testFields, null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('result_values must be an object');
    });

    it('should return error if resultValues is an array', () => {
      const result = service.validateResultValues(testFields, [] as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('result_values must be an object');
    });
  });
});

