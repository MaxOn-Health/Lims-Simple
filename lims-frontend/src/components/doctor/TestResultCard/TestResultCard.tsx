'use client';

import React from 'react';
import { Result } from '@/types/result.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TestStatusIndicator } from '../TestStatusIndicator/TestStatusIndicator';
import { format } from 'date-fns';
import { FlaskConical, FileText, User } from 'lucide-react';
import { ResultFieldRenderer } from '@/components/results/ResultFieldRenderer/ResultFieldRenderer';
import { getFieldLabel } from '@/utils/result-helpers';
import { TestFieldType } from '@/types/test.types';

interface TestResultCardProps {
  result: Result;
  test?: {
    id: string;
    name: string;
    category: string;
    normalRangeMin?: number | null;
    normalRangeMax?: number | null;
    unit?: string | null;
    fields?: Array<{
      field_name: string;
      field_type: TestFieldType;
      required: boolean;
      options?: string[];
    }>;
  };
}

const isValueAbnormal = (
  value: any,
  min: number | null | undefined,
  max: number | null | undefined
): boolean => {
  if (typeof value !== 'number' || isNaN(value)) return false;
  if (min !== null && min !== undefined && value < min) return true;
  if (max !== null && max !== undefined && value > max) return true;
  return false;
};

export const TestResultCard: React.FC<TestResultCardProps> = ({ result, test }) => {
  const resultValues = result.resultValues || {};
  const hasAbnormalValues = test
    ? Object.entries(resultValues).some(([key, value]) => {
        const field = test.fields?.find((f) => f.field_name === key);
        if (field?.field_type === TestFieldType.NUMBER && typeof value === 'number') {
          return isValueAbnormal(value, test.normalRangeMin, test.normalRangeMax);
        }
        return false;
      })
    : false;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{test?.name || 'Unknown Test'}</CardTitle>
          </div>
          <TestStatusIndicator isNormal={!hasAbnormalValues} />
        </div>
        {test?.category && (
          <p className="text-sm text-muted-foreground mt-1">Category: {test.category}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Result Values */}
        <div className="space-y-3">
          {Object.entries(resultValues).map(([fieldName, value]) => {
            const field = test?.fields?.find((f) => f.field_name === fieldName);
            const fieldLabel = field ? getFieldLabel(field.field_name) : fieldName;
            const isNumber = typeof value === 'number';
            const isAbnormal =
              isNumber &&
              field?.field_type === TestFieldType.NUMBER &&
              isValueAbnormal(value, test?.normalRangeMin, test?.normalRangeMax);

            return (
              <div key={fieldName} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    {fieldLabel}
                  </span>
                  {isAbnormal && (
                    <span className="text-xs text-destructive font-medium">Out of Range</span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-base font-semibold ${
                      isAbnormal ? 'text-destructive' : 'text-foreground'
                    }`}
                  >
                    {value}
                  </span>
                  {isNumber && test?.unit && (
                    <span className="text-sm text-muted-foreground">{test.unit}</span>
                  )}
                  {isNumber && test && (
                    <span className="text-xs text-muted-foreground">
                      (Normal: {test.normalRangeMin ?? '—'} - {test.normalRangeMax ?? '—'}{' '}
                      {test.unit || ''})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {result.notes && (
          <>
            <Separator />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Notes</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{result.notes}</p>
            </div>
          </>
        )}

        <Separator />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Entered Date</p>
            <p className="font-medium">
              {format(new Date(result.enteredAt), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
          {result.enteredByUser && (
            <div>
              <p className="text-muted-foreground">Entered By</p>
              <p className="font-medium">{result.enteredByUser.fullName}</p>
            </div>
          )}
          {result.verifiedAt && (
            <div>
              <p className="text-muted-foreground">Verified Date</p>
              <p className="font-medium">
                {format(new Date(result.verifiedAt), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
          )}
          {result.verifiedByUser && (
            <div>
              <p className="text-muted-foreground">Verified By</p>
              <p className="font-medium">{result.verifiedByUser.fullName}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

