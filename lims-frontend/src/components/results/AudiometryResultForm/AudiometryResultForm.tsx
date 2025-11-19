'use client';

import React from 'react';
import { Control, FieldErrors } from 'react-hook-form';
import { AudiometryTable } from './AudiometryTable';
import { AUDIOMETRY_DB_MIN, AUDIOMETRY_DB_MAX } from '@/utils/constants/audiometry.constants';

interface AudiometryResultFormProps {
  control: Control<any>;
  errors?: FieldErrors<any>;
  values?: Record<string, any>;
}

export const AudiometryResultForm: React.FC<AudiometryResultFormProps> = ({
  control,
  errors,
  values,
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* RIGHT Ear Table */}
        <div className="w-full">
          <AudiometryTable
            ear="right"
            control={control}
            errors={errors}
            values={values}
          />
        </div>

        {/* LEFT Ear Table */}
        <div className="w-full">
          <AudiometryTable
            ear="left"
            control={control}
            errors={errors}
            values={values}
          />
        </div>
      </div>

      {/* Legend/Info */}
      <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
        <strong>Instructions:</strong> Enter hearing threshold levels in decibels (DB) for each frequency.
        Values should be between {AUDIOMETRY_DB_MIN} and {AUDIOMETRY_DB_MAX} DB. Normal hearing range is -10 to 25 DB HL.
      </div>
    </div>
  );
};

