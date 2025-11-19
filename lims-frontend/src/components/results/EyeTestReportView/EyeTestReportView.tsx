'use client';

import React from 'react';
import { Result } from '@/types/result.types';
import { Test } from '@/types/test.types';
import {
  getVisionFieldName,
  getEyeParameterFieldName,
  getEyeHealthFieldName,
  EYE_LABELS,
  EYE_HEALTH_LABELS,
  EYE_PARAMETER_LABELS,
} from '@/utils/constants/eye.constants';

interface EyeTestReportViewProps {
  result: Result;
  test: Test;
}

export const EyeTestReportView: React.FC<EyeTestReportViewProps> = ({
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
  const date = new Date(result.enteredAt).toLocaleDateString('en-GB');
  const empId = result.patient?.patientId?.split('-').pop() || '-';

  // Get the person who entered/verified the result
  const enteredByName = result.enteredByUser?.fullName || result.enteredByUser?.email || 'Unknown';
  const verifiedByName = result.isVerified && result.verifiedByUser
    ? (result.verifiedByUser.fullName || result.verifiedByUser.email)
    : enteredByName;

  // Use verified by if available, otherwise use entered by
  const signatureName = verifiedByName;

  // Extract vision values
  const getVisionValue = (visionType: 'distance' | 'near', eye: 'right' | 'left', glassType: 'without_glass' | 'with_glass'): string => {
    const fieldName = getVisionFieldName(visionType, eye, glassType);
    const value = resultValues[fieldName];
    if (value === null || value === undefined || value === '') {
      return '';
    }
    return String(value);
  };

  // Extract eye parameter values
  const getEyeParameterValue = (parameter: 'sph' | 'cyl' | 'axis' | 'add' | 'vision', eye: 'right' | 'left'): string => {
    const fieldName = getEyeParameterFieldName(parameter, eye);
    const value = resultValues[fieldName];
    if (value === null || value === undefined || value === '') {
      return '';
    }
    return String(value);
  };

  // Extract eye health values
  const getEyeHealthValue = (field: keyof typeof EYE_HEALTH_LABELS): string => {
    const fieldName = getEyeHealthFieldName(field);
    const value = resultValues[fieldName];
    if (value === null || value === undefined || value === '') {
      return 'NORMAL';
    }
    return String(value).toUpperCase() || 'NORMAL';
  };

  // Get impression from vision status or generate default
  const getImpression = (): string => {
    const normalVision = resultValues.normal_vision;
    const nearNormalVision = resultValues.near_normal_vision;
    
    if (normalVision) {
      return 'Visual acuity Normal';
    } else if (nearNormalVision) {
      return 'Visual acuity Near normal';
    }
    
    // Check vision values to determine impression
    const rightDistanceWithout = getVisionValue('distance', 'right', 'without_glass');
    const leftDistanceWithout = getVisionValue('distance', 'left', 'without_glass');
    
    if (rightDistanceWithout && leftDistanceWithout) {
      return 'Visual acuity Normal';
    }
    
    return 'Visual acuity Normal';
  };

  // Extract doctor registration number if available (could be stored in user metadata)
  const doctorRegNo = result.verifiedByUser?.employeeId || result.enteredByUser?.employeeId || '003757';

  return (
    <div className="bg-white p-6 border-l-4 border-b-4 border-blue-700 relative" id="eye-test-report">
      {/* "Report" text vertically on the right */}
      <div className="absolute top-0 right-8 text-black font-bold text-lg transform -rotate-90 origin-center" style={{ writingMode: 'vertical-rl' }}>
        Report
      </div>

      {/* Patient Information Header */}
      <div className="border-2 border-gray-800 p-3 mb-4">
        <table className="w-full text-xs">
          <tbody>
            <tr>
              <td className="font-semibold pr-2">NAME :</td>
              <td className="pr-6">{patientName}</td>
              <td className="font-semibold pr-2">SEX :</td>
              <td className="pr-6">{sex}</td>
              <td className="font-semibold pr-2">AGE :</td>
              <td>{age}</td>
            </tr>
            <tr>
              <td className="font-semibold pr-2">DATE :</td>
              <td className="pr-6">{date}</td>
              <td className="font-semibold pr-2">EMP :</td>
              <td className="pr-6">{empId}</td>
              <td className="font-semibold pr-2">PHONE :</td>
              <td>{phone}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Report Title */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold">EYE EXAMINATION REPORT</h2>
      </div>

      {/* Eye Health Status */}
      <div className="mb-4 text-sm">
        <div className="space-y-1">
          <div><span className="font-semibold">Eye lids :</span> {getEyeHealthValue('EYE_LIDS')}</div>
          <div><span className="font-semibold">Conjunctiva :</span> {getEyeHealthValue('CONJUNCTIVA')}</div>
          <div><span className="font-semibold">CORNEA</span> : {getEyeHealthValue('CORNEA')}</div>
          <div><span className="font-semibold">Pupil :</span> {getEyeHealthValue('PUPIL')}</div>
          <div><span className="font-semibold">Colour vision :</span> {getEyeHealthValue('COLOUR_BLINDNESS')}</div>
        </div>
      </div>

      {/* Vision Tables Section */}
      <div className="mb-4">
        <div className="flex items-start gap-4">
          {/* Eye Icon */}
          <div className="pt-2">
            <svg width="40" height="30" viewBox="0 0 60 40">
              <path
                d="M30,10 C20,10 12,18 12,28 C12,32 14,35 17,37 C20,39 25,40 30,40 C35,40 40,39 43,37 C46,35 48,32 48,28 C48,18 40,10 30,10 Z"
                stroke="black"
                strokeWidth="2"
                fill="none"
              />
              <ellipse cx="30" cy="28" rx="8" ry="10" stroke="black" strokeWidth="2" fill="none" />
              <circle cx="30" cy="28" r="3" fill="black" />
            </svg>
          </div>

          {/* Vision Tables */}
          <div className="flex-1 space-y-4">
            {/* Distance Vision Table */}
            <div>
              <table className="w-full text-xs border-collapse border border-gray-800">
                <thead>
                  <tr>
                    <th className="border border-gray-800 px-2 py-1 bg-blue-600 text-white font-semibold">Distance vision</th>
                    <th className="border border-gray-800 px-2 py-1 bg-blue-600 text-white font-semibold">WITHOUT GLASS</th>
                    <th className="border border-gray-800 px-2 py-1 bg-blue-600 text-white font-semibold">WITH GLASS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-800 px-2 py-1 font-semibold bg-gray-50">RIGHT</td>
                    <td className="border border-gray-800 px-2 py-1 text-center">{getVisionValue('distance', 'right', 'without_glass') || ''}</td>
                    <td className="border border-gray-800 px-2 py-1 text-center">{getVisionValue('distance', 'right', 'with_glass') || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 px-2 py-1 font-semibold bg-gray-50">LEFT</td>
                    <td className="border border-gray-800 px-2 py-1 text-center">{getVisionValue('distance', 'left', 'without_glass') || ''}</td>
                    <td className="border border-gray-800 px-2 py-1 text-center">{getVisionValue('distance', 'left', 'with_glass') || ''}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Near Vision Table */}
            <div>
              <table className="w-full text-xs border-collapse border border-gray-800">
                <thead>
                  <tr>
                    <th className="border border-gray-800 px-2 py-1 bg-blue-600 text-white font-semibold">Near vision</th>
                    <th className="border border-gray-800 px-2 py-1 bg-blue-600 text-white font-semibold">WITHOUT GLASS</th>
                    <th className="border border-gray-800 px-2 py-1 bg-blue-600 text-white font-semibold">WITH GLASS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-800 px-2 py-1 font-semibold bg-gray-50">RIGHT</td>
                    <td className="border border-gray-800 px-2 py-1 text-center">{getVisionValue('near', 'right', 'without_glass') || ''}</td>
                    <td className="border border-gray-800 px-2 py-1 text-center">{getVisionValue('near', 'right', 'with_glass') || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-800 px-2 py-1 font-semibold bg-gray-50">LEFT</td>
                    <td className="border border-gray-800 px-2 py-1 text-center">{getVisionValue('near', 'left', 'without_glass') || ''}</td>
                    <td className="border border-gray-800 px-2 py-1 text-center">{getVisionValue('near', 'left', 'with_glass') || ''}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Subjective Refraction Table */}
      <div className="mb-4">
        <div className="text-sm font-semibold mb-2">Subjective Refraction:</div>
        <table className="w-full text-xs border-collapse border border-gray-800">
          <thead>
            <tr>
              <th className="border border-gray-800 px-2 py-1 bg-blue-600 text-white font-semibold"></th>
              <th className="border border-gray-800 px-2 py-1 bg-blue-600 text-white font-semibold">SPH</th>
              <th className="border border-gray-800 px-2 py-1 bg-blue-600 text-white font-semibold">CYL</th>
              <th className="border border-gray-800 px-2 py-1 bg-blue-600 text-white font-semibold">AXIS</th>
              <th className="border border-gray-800 px-2 py-1 bg-blue-600 text-white font-semibold">ADD</th>
              <th className="border border-gray-800 px-2 py-1 bg-blue-600 text-white font-semibold">VISION</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-800 px-2 py-1 font-semibold bg-gray-50">RIGHT</td>
              <td className="border border-gray-800 px-2 py-1 text-center">{getEyeParameterValue('sph', 'right') || ''}</td>
              <td className="border border-gray-800 px-2 py-1 text-center">{getEyeParameterValue('cyl', 'right') || ''}</td>
              <td className="border border-gray-800 px-2 py-1 text-center">{getEyeParameterValue('axis', 'right') || ''}</td>
              <td className="border border-gray-800 px-2 py-1 text-center">{getEyeParameterValue('add', 'right') || ''}</td>
              <td className="border border-gray-800 px-2 py-1 text-center">{getEyeParameterValue('vision', 'right') || ''}</td>
            </tr>
            <tr>
              <td className="border border-gray-800 px-2 py-1 font-semibold bg-gray-50">LEFT</td>
              <td className="border border-gray-800 px-2 py-1 text-center">{getEyeParameterValue('sph', 'left') || ''}</td>
              <td className="border border-gray-800 px-2 py-1 text-center">{getEyeParameterValue('cyl', 'left') || ''}</td>
              <td className="border border-gray-800 px-2 py-1 text-center">{getEyeParameterValue('axis', 'left') || ''}</td>
              <td className="border border-gray-800 px-2 py-1 text-center">{getEyeParameterValue('add', 'left') || ''}</td>
              <td className="border border-gray-800 px-2 py-1 text-center">{getEyeParameterValue('vision', 'left') || ''}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Impression and Signature Section */}
      <div className="flex justify-between items-end mt-8">
        {/* Impression */}
        <div className="text-sm">
          <span className="font-semibold">Impression :</span> {getImpression()}
        </div>

        {/* Doctor Signature */}
        <div className="text-right">
          <div className="mb-2 font-cursive text-lg italic border-b-2 border-black pb-1" style={{ width: '150px' }}>
            {signatureName}
          </div>
          <div className="text-xs font-semibold">
            {signatureName}
            <br />
            REG NO.{doctorRegNo}
          </div>
        </div>
      </div>
    </div>
  );
};

