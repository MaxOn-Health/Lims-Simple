'use client';

import React from 'react';
import { useFieldArray, Control, UseFormWatch } from 'react-hook-form';
import { TestFieldFormData } from '@/utils/validation/test-schemas';
import { TestFieldType, TEST_FIELD_TYPES } from '@/types/test.types';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Controller } from 'react-hook-form';

interface TestFieldsBuilderProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  errors: any;
}

export const TestFieldsBuilder: React.FC<TestFieldsBuilderProps> = ({
  control,
  watch,
  errors,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'testFields',
  });

  const fieldTypeOptions = TEST_FIELD_TYPES.map((type) => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
  }));

  const addField = () => {
    append({
      field_name: '',
      field_type: TestFieldType.TEXT,
      required: false,
      options: null,
      unit: null,
      normalRangeMin: null,
      normalRangeMax: null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Test Fields <span className="text-red-500">*</span>
        </label>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          Add Field
        </Button>
      </div>

      {fields.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-sm text-gray-500 mb-4">No test fields added yet.</p>
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            Add First Field
          </Button>
        </div>
      )}

      {fields.map((field, index) => {
        const fieldType = watch(`testFields.${index}.field_type`);
        const isSelectType = fieldType === TestFieldType.SELECT;
        const isNumberType = fieldType === TestFieldType.NUMBER;

        return (
          <div
            key={field.id}
            className="border border-gray-200 rounded-lg p-4 space-y-4"
          >
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-medium text-gray-900">Field {index + 1}</h4>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  Remove
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  id={`testFields.${index}.field_name`}
                  label="Field Name"
                  placeholder="e.g., result_value"
                  required
                  error={errors.testFields?.[index]?.field_name?.message}
                  {...control.register(`testFields.${index}.field_name`)}
                />
              </div>

              <div>
                <label
                  htmlFor={`testFields.${index}.field_type`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Field Type <span className="text-red-500">*</span>
                </label>
                <Controller
                  name={`testFields.${index}.field_type`}
                  control={control}
                  render={({ field: selectField }) => (
                    <select
                      {...selectField}
                      id={`testFields.${index}.field_type`}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      {fieldTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.testFields?.[index]?.field_type && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.testFields[index].field_type.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <Controller
                name={`testFields.${index}.required`}
                control={control}
                render={({ field: checkboxField }) => (
                  <input
                    type="checkbox"
                    id={`testFields.${index}.required`}
                    checked={checkboxField.value}
                    onChange={(e) => checkboxField.onChange(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                )}
              />
              <label
                htmlFor={`testFields.${index}.required`}
                className="ml-2 block text-sm text-gray-900"
              >
                Required
              </label>
            </div>

            {isNumberType && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <Input
                    id={`testFields.${index}.unit`}
                    label="Unit"
                    placeholder="e.g., gm/dL"
                    error={errors.testFields?.[index]?.unit?.message}
                    {...control.register(`testFields.${index}.unit`)}
                  />
                </div>
                <div>
                  <Controller
                    name={`testFields.${index}.normalRangeMin`}
                    control={control}
                    render={({ field: minField }) => (
                      <Input
                        id={`testFields.${index}.normalRangeMin`}
                        label="Range Min"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 11.0"
                        error={errors.testFields?.[index]?.normalRangeMin?.message}
                        value={minField.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          minField.onChange(val === '' ? null : parseFloat(val));
                        }}
                      />
                    )}
                  />
                </div>
                <div>
                  <Controller
                    name={`testFields.${index}.normalRangeMax`}
                    control={control}
                    render={({ field: maxField }) => (
                      <Input
                        id={`testFields.${index}.normalRangeMax`}
                        label="Range Max"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 16.0"
                        error={errors.testFields?.[index]?.normalRangeMax?.message}
                        value={maxField.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          maxField.onChange(val === '' ? null : parseFloat(val));
                        }}
                      />
                    )}
                  />
                </div>
              </div>
            )}

            {isSelectType && (
              <div>
                <label
                  htmlFor={`testFields.${index}.options`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Options <span className="text-red-500">*</span>
                </label>
                <Controller
                  name={`testFields.${index}.options`}
                  control={control}
                  render={({ field: optionsField }) => (
                    <textarea
                      {...optionsField}
                      id={`testFields.${index}.options`}
                      rows={3}
                      placeholder="Enter options separated by commas (e.g., Option 1, Option 2, Option 3)"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      onChange={(e) => {
                        const value = e.target.value;
                        const options = value
                          .split(',')
                          .map((opt) => opt.trim())
                          .filter((opt) => opt.length > 0);
                        optionsField.onChange(options.length > 0 ? options : null);
                      }}
                      value={
                        optionsField.value && Array.isArray(optionsField.value)
                          ? optionsField.value.join(', ')
                          : ''
                      }
                    />
                  )}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter options separated by commas
                </p>
                {errors.testFields?.[index]?.options && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.testFields[index].options.message}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {errors.testFields && typeof errors.testFields.message === 'string' && (
        <p className="text-sm text-red-600">{errors.testFields.message}</p>
      )}
    </div>
  );
};

