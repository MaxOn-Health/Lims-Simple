'use client';

import React from 'react';
import { Result } from '@/types/result.types';
import { Test } from '@/types/test.types';
import { AUDIOMETRY_FREQUENCIES, getAudiometryFieldName } from '@/utils/constants/audiometry.constants';

interface AudiometryReportViewProps {
  result: Result;
  test: Test;
}

export const AudiometryReportView: React.FC<AudiometryReportViewProps> = ({ 
  result, 
  test,
}) => {
  const resultValues = result.resultValues || {};
  
  // Extract patient information
  const patientName = result.patient?.name || '-';
  const patientId = result.patient?.patientId || '-';
  const age = result.patient?.dateOfBirth 
    ? new Date().getFullYear() - new Date(result.patient.dateOfBirth).getFullYear()
    : '-';
  const sex = result.patient?.gender || '-';
  const phone = result.patient?.phone || '-';
  const address = result.patient?.address || '-';
  const date = new Date(result.enteredAt).toLocaleDateString('en-GB');
  const empId = result.patient?.patientId?.split('-').pop() || '-';
  
  // Get the person who entered/verified the result
  const enteredByName = result.enteredByUser?.fullName || result.enteredByUser?.email || 'Unknown';
  const verifiedByName = result.isVerified && result.verifiedByUser
    ? (result.verifiedByUser.fullName || result.verifiedByUser.email)
    : enteredByName;
  
  // Use verified by if available, otherwise use entered by
  const signatureName = verifiedByName;

  // Extract values for each ear
  const getValue = (ear: 'right' | 'left', frequency: number): number | null => {
    const fieldName = getAudiometryFieldName(ear, frequency);
    const value = resultValues[fieldName];
    if (value === null || value === undefined || isNaN(Number(value))) {
      return null;
    }
    return Number(value);
  };

  // Calculate average A.C (DB) for provisional diagnosis
  const calculateAverage = (ear: 'right' | 'left'): number | null => {
    const values = AUDIOMETRY_FREQUENCIES.map(freq => getValue(ear, freq))
      .filter(v => v !== null) as number[];
    if (values.length === 0) return null;
    return Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
  };

  const rightAvg = calculateAverage('right');
  const leftAvg = calculateAverage('left');

  // Get hearing status based on average
  const getHearingStatus = (avg: number | null): string => {
    if (avg === null) return 'N/A';
    if (avg >= -10 && avg <= 25) return 'HEARING SENSITIVITY WITHIN NORMAL LIMITS';
    if (avg >= 26 && avg <= 45) return 'MILD HEARING LOSS';
    if (avg >= 46 && avg <= 65) return 'MODERATE HEARING LOSS';
    if (avg >= 66 && avg <= 85) return 'SEVERE HEARING LOSS';
    return 'PROFOUND HEARING LOSS';
  };

  // Create SVG audiogram graph
  const createAudiogram = (ear: 'right' | 'left') => {
    const width = 360;
    const height = 280;
    const padding = { top: 30, right: 40, bottom: 40, left: 50 };
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Frequency positions (logarithmic scale)
    const freqPositions = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000];
    const freqLabels = ['125', '250', '500', '750', '1k', '1k5', '2k', '3k', '4k', '6k', '8k'];
    
    // DB range: -20 to 120 (inverted - higher DB means worse hearing)
    const dbMin = -20;
    const dbMax = 120;

    const getX = (freqIndex: number) => {
      return padding.left + (freqIndex / (freqPositions.length - 1)) * graphWidth;
    };

    const getY = (db: number) => {
      const ratio = (db - dbMin) / (dbMax - dbMin);
      return padding.top + ratio * graphHeight;
    };

    // Get data points
    const points = freqPositions.map((freq, idx) => {
      const value = getValue(ear, freq);
      return {
        x: getX(idx),
        y: value !== null ? getY(value) : null,
        value,
        freq: freqLabels[idx],
      };
    }).filter(p => p.y !== null);

    // Create path
    const pathData = points.map((p, idx) => 
      `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    const color = ear === 'right' ? '#ef4444' : '#3b82f6';
    const symbol = ear === 'right' ? 'o' : 'x';

    return (
      <svg width={width} height={height} className="border border-gray-300 bg-white">
        {/* Title */}
        <text x={width / 2} y={15} textAnchor="middle" className="text-xs font-semibold">
          Hearing Loss In DB
        </text>
        <text x={width - 10} y={15} textAnchor="end" className="text-xs font-bold">
          {ear.toUpperCase()}
        </text>

        {/* Grid lines - horizontal (DB levels) */}
        {[-20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map(db => (
          <g key={db}>
            <line
              x1={padding.left}
              y1={getY(db)}
              x2={width - padding.right}
              y2={getY(db)}
              stroke="#d1d5db"
              strokeWidth="1"
            />
            <text
              x={padding.left - 5}
              y={getY(db) + 4}
              textAnchor="end"
              className="text-[10px]"
            >
              {db}
            </text>
          </g>
        ))}

        {/* Grid lines - vertical (frequencies) */}
        {freqPositions.map((freq, idx) => (
          <line
            key={freq}
            x1={getX(idx)}
            y1={padding.top}
            x2={getX(idx)}
            y2={height - padding.bottom}
            stroke="#d1d5db"
            strokeWidth="1"
          />
        ))}

        {/* X-axis labels */}
        {freqLabels.map((label, idx) => (
          <text
            key={label}
            x={getX(idx)}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            className="text-[10px]"
          >
            {label}
          </text>
        ))}

        {/* X-axis title */}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          className="text-xs font-semibold"
        >
          Frequency In HERTZ
        </text>

        {/* Plot line */}
        {points.length > 1 && (
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
        )}

        {/* Plot points */}
        {points.map((point, idx) => (
          <g key={idx}>
            {symbol === 'o' ? (
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="none"
                stroke={color}
                strokeWidth="2"
              />
            ) : (
              <>
                <line
                  x1={point.x - 4}
                  y1={point.y! - 4}
                  x2={point.x + 4}
                  y2={point.y! + 4}
                  stroke={color}
                  strokeWidth="2"
                />
                <line
                  x1={point.x - 4}
                  y1={point.y! + 4}
                  x2={point.x + 4}
                  y2={point.y! - 4}
                  stroke={color}
                  strokeWidth="2"
                />
              </>
            )}
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="bg-white p-6 border-4 border-blue-700" id="audiometry-report">
      {/* Header Section */}
      <div className="border-2 border-gray-800 p-3 mb-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex">
            <span className="font-semibold w-20">Name :</span>
            <span>{patientName}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-20">Emp ID :</span>
            <span>{empId}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-20">Age :</span>
            <span>{age} {age !== '-' ? 'Years' : ''}</span>
            <span className="font-semibold ml-4 w-16">Sex :</span>
            <span>{sex}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-20">Date :</span>
            <span>{date}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-20">Address :</span>
            <span>{address}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-20">Phone :</span>
            <span>{phone}</span>
          </div>
        </div>
      </div>

      {/* Audiogram Section */}
      <div className="mb-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          <svg width="60" height="40" viewBox="0 0 60 40">
            <path d="M5,20 Q15,5 25,20 Q35,35 45,20" stroke="black" strokeWidth="2" fill="none"/>
            <ellipse cx="15" cy="20" rx="10" ry="15" stroke="black" strokeWidth="2" fill="none"/>
            <path d="M10,12 Q15,10 20,12" stroke="black" strokeWidth="1.5" fill="none"/>
          </svg>
          <h2 className="text-lg font-bold text-red-600">AUDIOGRAM</h2>
          <svg width="60" height="40" viewBox="0 0 60 40">
            <path d="M15,20 Q25,5 35,20 Q45,35 55,20" stroke="black" strokeWidth="2" fill="none"/>
            <ellipse cx="45" cy="20" rx="10" ry="15" stroke="black" strokeWidth="2" fill="none"/>
            <path d="M40,12 Q45,10 50,12" stroke="black" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>{createAudiogram('right')}</div>
          <div>{createAudiogram('left')}</div>
        </div>
      </div>

      {/* Symbol Table */}
      <div className="mb-4">
        <table className="w-full text-xs border border-gray-800">
          <thead>
            <tr className="bg-red-600 text-white">
              <th colSpan={7} className="py-1 text-center font-bold">SYMBOL TABLE</th>
            </tr>
            <tr className="border-t border-gray-800">
              <th className="border-r border-gray-800 px-2 py-1">L</th>
              <th className="border-r border-gray-800 px-2 py-1">R</th>
              <th className="border-r border-gray-800 px-2 py-1">LM</th>
              <th className="border-r border-gray-800 px-2 py-1">RM</th>
              <th className="border-r border-gray-800 px-2 py-1">BL</th>
              <th className="border-r border-gray-800 px-2 py-1">BR</th>
              <th className="px-2 py-1">BLM</th>
              <th className="px-2 py-1">BRM</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-800">
              <td className="border-r border-gray-800 px-2 py-1 text-center">X</td>
              <td className="border-r border-gray-800 px-2 py-1 text-center">O</td>
              <td className="border-r border-gray-800 px-2 py-1 text-center">□</td>
              <td className="border-r border-gray-800 px-2 py-1 text-center">△</td>
              <td className="border-r border-gray-800 px-2 py-1 text-center">&gt;</td>
              <td className="border-r border-gray-800 px-2 py-1 text-center">&lt;</td>
              <td className="px-2 py-1 text-center">]</td>
              <td className="px-2 py-1 text-center">[</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-2 gap-4">
        {/* Provisional Diagnosis */}
        <div>
          <table className="w-full text-xs border-2 border-gray-800 mb-4">
            <thead>
              <tr>
                <th colSpan={3} className="border-b-2 border-gray-800 py-1 text-center font-bold">
                  Provisional Diagnosis
                </th>
              </tr>
              <tr className="border-b border-gray-800">
                <th className="border-r border-gray-800 px-2 py-1"></th>
                <th className="border-r border-gray-800 px-2 py-1">A.C (DB)</th>
                <th className="px-2 py-1">B.C</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="border-r border-gray-800 px-2 py-1 font-semibold">Right</td>
                <td className="border-r border-gray-800 px-2 py-1 text-center">{rightAvg !== null ? rightAvg : '-'}</td>
                <td className="px-2 py-1 text-center">-</td>
              </tr>
              <tr>
                <td className="border-r border-gray-800 px-2 py-1 font-semibold">Left</td>
                <td className="border-r border-gray-800 px-2 py-1 text-center">{leftAvg !== null ? leftAvg : '-'}</td>
                <td className="px-2 py-1 text-center">-</td>
              </tr>
            </tbody>
          </table>

          {/* Remarks */}
          <div className="text-xs">
            <p className="mb-2">
              <span className="font-bold">Remarks : RIGHT :</span> {getHearingStatus(rightAvg)}
            </p>
            <p className="mb-4">
              <span className="font-bold ml-16">LEFT :</span> {getHearingStatus(leftAvg)}
            </p>
          </div>
        </div>

        {/* Plot Area & Hearing Loss */}
        <div>
          <div className="border-2 border-gray-800 p-3 mb-2">
            <h3 className="text-sm font-bold mb-2">Plot Area <span className="text-xs font-normal">aring Loss</span></h3>
            <table className="w-full text-xs">
              <tbody>
                <tr>
                  <td className="py-0.5">Normal Hearing</td>
                  <td className="text-right">-10 - 25 db HL</td>
                </tr>
                <tr>
                  <td className="py-0.5">Mild Hearing loss</td>
                  <td className="text-right">30 - 45 db HL</td>
                </tr>
                <tr>
                  <td className="py-0.5">Moderate Hearing loss</td>
                  <td className="text-right">50 - 65 db HL</td>
                </tr>
                <tr>
                  <td className="py-0.5">Severe Hearing Loss</td>
                  <td className="text-right">70 - 85 db HL</td>
                </tr>
                <tr>
                  <td className="py-0.5">Profound Hearing Loss</td>
                  <td className="text-right">&gt;90 db HL</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="mt-8 flex justify-end">
        <div className="text-right">
          <div className="mb-2 font-cursive text-xl italic">{signatureName}</div>
          <div className="text-xs font-semibold border-t border-gray-800 pt-1">
            Signature of Audiologist<br />
            <span className="text-blue-700 uppercase">{signatureName}</span><br />
            {result.isVerified && result.verifiedAt && (
              <span className="text-xs">Verified on {new Date(result.verifiedAt).toLocaleDateString('en-GB')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Final Report Badge */}
      <div className="absolute top-8 right-8 text-4xl font-bold">
        Final Report
      </div>
    </div>
  );
};

