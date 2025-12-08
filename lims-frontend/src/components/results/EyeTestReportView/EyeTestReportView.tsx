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

    // Check for string "Yes" (backend uses strings now)
    if (normalVision === 'Yes' || normalVision === true) {
      return 'Visual acuity Normal';
    } else if (nearNormalVision === 'Yes' || nearNormalVision === true) {
      return 'Visual acuity Near normal';
    }

    // Check vision values to determine impression
    const rightDistanceWithout = getVisionValue('distance', 'right', 'without_glass');
    const leftDistanceWithout = getVisionValue('distance', 'left', 'without_glass');

    if (rightDistanceWithout && leftDistanceWithout) {
      // Simple check if values exist
      return 'Visual acuity Normal';
    }

    return 'Visual acuity Normal';
  };

  // Extract doctor registration number if available (could be stored in user metadata)
  const doctorRegNo = result.verifiedByUser?.employeeId || result.enteredByUser?.employeeId || '003757';

  return (
    <div className="bg-white p-12 max-w-[210mm] mx-auto text-gray-800 font-sans" id="eye-test-report">

      {/* Header Section */}
      <div className="flex justify-between items-start mb-10 border-b-2 border-blue-900 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight">MaxOn Healthcare</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium tracking-wide">EXCELLENCE IN DIAGNOSTICS</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-800">EYE EXAMINATION REPORT</h2>
          <p className="text-sm text-gray-500 mt-1">Date: {date}</p>
        </div>
      </div>

      {/* Patient Information Section */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
          <div className="flex border-b border-gray-200 pb-2">
            <span className="text-gray-500 font-medium w-24">Patient Name</span>
            <span className="font-semibold text-gray-900">{patientName}</span>
          </div>
          <div className="flex border-b border-gray-200 pb-2">
            <span className="text-gray-500 font-medium w-24">Gender/Age</span>
            <span className="font-semibold text-gray-900">{sex} / {age} Yrs</span>
          </div>
          <div className="flex border-b border-gray-200 pb-2">
            <span className="text-gray-500 font-medium w-24">Patient ID</span>
            <span className="font-semibold text-gray-900 font-mono tracking-wider">{patientId}</span>
          </div>
          <div className="flex border-b border-gray-200 pb-2">
            <span className="text-gray-500 font-medium w-24">Ref. By</span>
            <span className="font-semibold text-gray-900">Dr. Self</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-8 mb-8">

        {/* Left Column: Visual Acuity Tables */}
        <div className="col-span-12">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            Visual Acuity
          </h3>

          <div className="flex gap-6 mb-6">
            {/* Left Eye visual - simple illustrative icon */}
            <div className="hidden md:block w-32 pt-4 opacity-80">
              <svg viewBox="0 0 100 60" className="w-full text-blue-900 fill-current">
                <path d="M50,10 C20,10 5,30 5,30 C5,30 20,50 50,50 C80,50 95,30 95,30 C95,30 80,10 50,10 Z M50,42 C43.37,42 38,36.63 38,30 C38,23.37 43.37,18 50,18 C56.63,18 62,23.37 62,30 C62,36.63 56.63,42 50,42 Z" fill="none" stroke="currentColor" strokeWidth="3" />
                <circle cx="50" cy="30" r="8" fill="currentColor" />
              </svg>
            </div>

            <div className="flex-1 space-y-6">
              {/* Distance Vision */}
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="py-2 px-4 text-left font-bold text-blue-900 rounded-l-md">Distance Vision</th>
                    <th className="py-2 px-4 text-center font-semibold text-gray-700">Right Eye (OD)</th>
                    <th className="py-2 px-4 text-center font-semibold text-gray-700 rounded-r-md">Left Eye (OS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 px-4 font-medium text-gray-500">Without Glasses</td>
                    <td className="py-2 px-4 text-center font-bold text-gray-900">{getVisionValue('distance', 'right', 'without_glass') || '-'}</td>
                    <td className="py-2 px-4 text-center font-bold text-gray-900">{getVisionValue('distance', 'left', 'without_glass') || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-medium text-gray-500">With Glasses</td>
                    <td className="py-2 px-4 text-center font-bold text-gray-900">{getVisionValue('distance', 'right', 'with_glass') || '-'}</td>
                    <td className="py-2 px-4 text-center font-bold text-gray-900">{getVisionValue('distance', 'left', 'with_glass') || '-'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Near Vision */}
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="py-2 px-4 text-left font-bold text-blue-900 rounded-l-md">Near Vision</th>
                    <th className="py-2 px-4 text-center font-semibold text-gray-700">Right Eye (OD)</th>
                    <th className="py-2 px-4 text-center font-semibold text-gray-700 rounded-r-md">Left Eye (OS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 px-4 font-medium text-gray-500">Without Glasses</td>
                    <td className="py-2 px-4 text-center font-bold text-gray-900">{getVisionValue('near', 'right', 'without_glass') || '-'}</td>
                    <td className="py-2 px-4 text-center font-bold text-gray-900">{getVisionValue('near', 'left', 'without_glass') || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-medium text-gray-500">With Glasses</td>
                    <td className="py-2 px-4 text-center font-bold text-gray-900">{getVisionValue('near', 'right', 'with_glass') || '-'}</td>
                    <td className="py-2 px-4 text-center font-bold text-gray-900">{getVisionValue('near', 'left', 'with_glass') || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Full Width: Refraction */}
        <div className="col-span-12">
          <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
            Subjective Refraction
          </h3>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-900 text-white">
                  <th className="py-3 px-4 text-left font-semibold w-24">Eye</th>
                  <th className="py-3 px-4 text-center font-semibold">SPH</th>
                  <th className="py-3 px-4 text-center font-semibold">CYL</th>
                  <th className="py-3 px-4 text-center font-semibold">AXIS</th>
                  <th className="py-3 px-4 text-center font-semibold">ADD</th>
                  <th className="py-3 px-4 text-center font-semibold">VISION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900 bg-gray-50">Right (OD)</td>
                  <td className="py-3 px-4 text-center">{getEyeParameterValue('sph', 'right') || '-'}</td>
                  <td className="py-3 px-4 text-center">{getEyeParameterValue('cyl', 'right') || '-'}</td>
                  <td className="py-3 px-4 text-center">{getEyeParameterValue('axis', 'right') || '-'}</td>
                  <td className="py-3 px-4 text-center">{getEyeParameterValue('add', 'right') || '-'}</td>
                  <td className="py-3 px-4 text-center font-medium">{getEyeParameterValue('vision', 'right') || '-'}</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900 bg-gray-50">Left (OS)</td>
                  <td className="py-3 px-4 text-center">{getEyeParameterValue('sph', 'left') || '-'}</td>
                  <td className="py-3 px-4 text-center">{getEyeParameterValue('cyl', 'left') || '-'}</td>
                  <td className="py-3 px-4 text-center">{getEyeParameterValue('axis', 'left') || '-'}</td>
                  <td className="py-3 px-4 text-center">{getEyeParameterValue('add', 'left') || '-'}</td>
                  <td className="py-3 px-4 text-center font-medium">{getEyeParameterValue('vision', 'left') || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Examination Findings - Two Column */}
      <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
        <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
        Examination Findings
      </h3>
      <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-10 text-sm">
        <div className="flex justify-between border-b border-gray-100 pb-1">
          <span className="font-medium text-gray-500">Eye Lids</span>
          <span className="font-semibold text-gray-900">{getEyeHealthValue('EYE_LIDS')}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 pb-1">
          <span className="font-medium text-gray-500">Conjunctiva</span>
          <span className="font-semibold text-gray-900">{getEyeHealthValue('CONJUNCTIVA')}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 pb-1">
          <span className="font-medium text-gray-500">Cornea</span>
          <span className="font-semibold text-gray-900">{getEyeHealthValue('CORNEA')}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 pb-1">
          <span className="font-medium text-gray-500">Pupil</span>
          <span className="font-semibold text-gray-900">{getEyeHealthValue('PUPIL')}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 pb-1">
          <span className="font-medium text-gray-500">Colour Vision</span>
          <span className="font-semibold text-gray-900">{getEyeHealthValue('COLOUR_BLINDNESS')}</span>
        </div>
      </div>

      {/* Impression & Signature */}
      <div className="mt-8 border-t-2 border-gray-200 pt-6">
        <div className="flex justify-between items-end">
          <div className="max-w-[60%]">
            <p className="text-gray-500 font-semibold mb-1 text-xs uppercase tracking-wider">Clinical Impression</p>
            <p className="text-lg font-bold text-gray-900">{getImpression()}</p>
          </div>

          <div className="text-right">
            {signatureName && (
              <div className="font-cursive text-xl text-blue-900 italic mb-1">{signatureName}</div>
            )}
            <div className="h-0.5 w-40 bg-gray-900 mb-2 ml-auto"></div>
            <p className="font-bold text-gray-900 text-sm">{signatureName}</p>
            <p className="text-xs text-gray-500">Senior Optometrist</p>
            <p className="text-xs text-gray-400">Reg No: {doctorRegNo}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
        <p>This report is electronically generated and verified.</p>
        <p>MaxOn Healthcare • 123 Health Avenue, Medical District • +91 99999 88888</p>
      </div>

    </div>
  );
};

