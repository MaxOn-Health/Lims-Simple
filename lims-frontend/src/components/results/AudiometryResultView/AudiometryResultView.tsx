'use client';

import React from 'react';
import { Result } from '@/types/result.types';
import { Test } from '@/types/test.types';
import { AUDIOMETRY_FREQUENCIES, getAudiometryFieldName, getHearingLossClassification } from '@/utils/constants/audiometry.constants';
import { cn } from '@/lib/utils';
import { ResultStatusBadge } from '../ResultStatusBadge/ResultStatusBadge';
import { calculateResultStatus } from '@/utils/result-helpers';

interface AudiometryResultViewProps {
  result: Result;
  test: Test;
}

export const AudiometryResultView: React.FC<AudiometryResultViewProps> = ({ result, test }) => {
  const resultValues = result.resultValues || {};
  const resultStatus = calculateResultStatus(result.resultValues, test);

  // Extract values for each ear
  const getValue = (ear: 'right' | 'left', frequency: number): number | null => {
    const fieldName = getAudiometryFieldName(ear, frequency);
    const value = resultValues[fieldName];
    if (value === null || value === undefined || isNaN(Number(value))) {
      return null;
    }
    return Number(value);
  };

  const getStatusBadge = (value: number | null) => {
    if (value === null) return null;
    const classification = getHearingLossClassification(value);
    const isNormal = value >= -10 && value <= 25;
    
    if (isNormal) {
      return <span className="text-xs text-green-600 font-medium">Normal</span>;
    }
    return <span className="text-xs text-destructive font-medium">Abnormal</span>;
  };

  const getIndicatorColor = (value: number | null) => {
    if (value === null) return '';
    const classification = getHearingLossClassification(value);
    const colorClasses = {
      green: 'bg-green-100 border-green-300',
      yellow: 'bg-yellow-100 border-yellow-300',
      orange: 'bg-orange-100 border-orange-300',
      red: 'bg-red-100 border-red-300',
    };
    return colorClasses[classification.color as keyof typeof colorClasses] || '';
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* RIGHT Ear Table */}
        <div className="w-full">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold text-xs border border-gray-300 bg-red-600 text-white">
                    HZ
                  </th>
                  <th className="px-2 py-1.5 text-left font-semibold text-xs border border-gray-300 bg-red-600 text-white">
                    SOUND (DB)
                  </th>
                </tr>
                <tr>
                  <th colSpan={2} className="px-2 py-1 text-center font-bold text-sm border border-gray-300 bg-red-600 text-white">
                    RIGHT
                  </th>
                </tr>
              </thead>
              <tbody>
                {AUDIOMETRY_FREQUENCIES.map((frequency) => {
                  const value = getValue('right', frequency);
                  return (
                    <tr key={frequency} className="border border-gray-300 bg-red-50">
                      <td className="px-2 py-1 font-medium text-xs border border-gray-300 bg-red-50">
                        {frequency}
                      </td>
                      <td className="px-2 py-1 border border-gray-300 bg-red-50">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{value !== null ? value : '—'}</span>
                          {value !== null && (
                            <>
                              <div
                                className={cn(
                                  'inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded border text-[10px]',
                                  getIndicatorColor(value)
                                )}
                                title={getHearingLossClassification(value).label}
                              />
                              {getStatusBadge(value)}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* LEFT Ear Table */}
        <div className="w-full">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold text-xs border border-gray-300 bg-blue-600 text-white">
                    HZ
                  </th>
                  <th className="px-2 py-1.5 text-left font-semibold text-xs border border-gray-300 bg-blue-600 text-white">
                    SOUND (DB)
                  </th>
                </tr>
                <tr>
                  <th colSpan={2} className="px-2 py-1 text-center font-bold text-sm border border-gray-300 bg-blue-600 text-white">
                    LEFT
                  </th>
                </tr>
              </thead>
              <tbody>
                {AUDIOMETRY_FREQUENCIES.map((frequency) => {
                  const value = getValue('left', frequency);
                  return (
                    <tr key={frequency} className="border border-gray-300 bg-blue-50">
                      <td className="px-2 py-1 font-medium text-xs border border-gray-300 bg-blue-50">
                        {frequency}
                      </td>
                      <td className="px-2 py-1 border border-gray-300 bg-blue-50">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{value !== null ? value : '—'}</span>
                          {value !== null && (
                            <>
                              <div
                                className={cn(
                                  'inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded border text-[10px]',
                                  getIndicatorColor(value)
                                )}
                                title={getHearingLossClassification(value).label}
                              />
                              {getStatusBadge(value)}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Info */}
      <div className="mt-2 p-2 bg-muted rounded text-xs text-muted-foreground">
        <strong>Normal Range:</strong> -10.00 - 25.00 dB HL • 
        <strong> Status:</strong> <ResultStatusBadge status={resultStatus} />
      </div>
    </div>
  );
};





