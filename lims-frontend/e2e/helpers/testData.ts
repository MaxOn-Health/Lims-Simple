/**
 * Test Data Helpers
 *
 * Utilities for creating test data via API or preparing test data
 */

const API_BASE_URL = 'http://localhost:3000';

/**
 * Generate a random test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Generate a random test phone number (10 digits, starts with 9)
 */
export function generateTestPhoneNumber(): string {
  return `9${Math.floor(100000000 + Math.random() * 900000000)}`;
}

/**
 * Generate a random patient name
 */
export function generateTestPatientName(): string {
  const timestamp = Date.now();
  return `Test Patient ${timestamp}`;
}

/**
 * Patient data generator
 */
export interface PatientData {
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  contactNumber: string;
  email: string;
  address?: string;
  employerName?: string;
  employmentType?: string;
}

export function generatePatientData(overrides?: Partial<PatientData>): PatientData {
  return {
    name: generateTestPatientName(),
    age: Math.floor(25 + Math.random() * 50), // 25-75
    gender: ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)] as 'Male' | 'Female' | 'Other',
    contactNumber: generateTestPhoneNumber(),
    email: generateTestEmail('patient'),
    address: '123 Test Street, QA Lab',
    employerName: 'Test Company Inc',
    employmentType: 'Regular',
    ...overrides,
  };
}

/**
 * Test definitions available in the system
 */
export const TEST_DEFINITIONS = {
  XRAY_CHEST: 'X-Ray Chest',
  AUDIOMETRY: 'Audiometry Test',
  EYE_TEST: 'Eye Test',
  PFT: 'Pulmonary Function Test',
  ECG: 'ECG',
  BLOOD_COMPLETE: 'Blood Complete',
  BLOOD_LIPID: 'Blood Lipid Profile',
  BLOOD_LIVER: 'Liver Function Test',
  BLOOD_KIDNEY: 'Kidney Function Test',
  BLOOD_THYROID: 'Thyroid Profile',
  BLOOD_SUGAR: 'Blood Sugar (Fasting)',
  BLOOD_HBA1C: 'HbA1c',
} as const;

/**
 * Get a random test
 */
export function getRandomTest(): string {
  const tests = Object.values(TEST_DEFINITIONS);
  return tests[Math.floor(Math.random() * tests.length)];
}

/**
 * Get tests by category
 */
export function getTestsByCategory(category: 'xray' | 'audiometry' | 'eye' | 'blood' | 'all'): string[] {
  switch (category) {
    case 'xray':
      return [TEST_DEFINITIONS.XRAY_CHEST];
    case 'audiometry':
      return [TEST_DEFINITIONS.AUDIOMETRY];
    case 'eye':
      return [TEST_DEFINITIONS.EYE_TEST];
    case 'blood':
      return [
        TEST_DEFINITIONS.BLOOD_COMPLETE,
        TEST_DEFINITIONS.BLOOD_LIPID,
        TEST_DEFINITIONS.BLOOD_LIVER,
        TEST_DEFINITIONS.BLOOD_KIDNEY,
        TEST_DEFINITIONS.BLOOD_THYROID,
        TEST_DEFINITIONS.BLOOD_SUGAR,
        TEST_DEFINITIONS.BLOOD_HBA1C,
      ];
    case 'all':
    default:
      return Object.values(TEST_DEFINITIONS);
  }
}

/**
 * Result data generators for different test types
 */

/**
 * X-Ray Chest result data
 */
export function generateXRayResult() {
  return {
    findings: 'Patient chest X-ray shows clear lungs. No consolidation, pneumothorax, or pleural effusion. Cardiac silhouette is normal. No bony abnormalities.',
    impression: 'Normal chest X-ray study.',
  };
}

/**
 * Audiometry result data
 * Generates values for 22 frequency fields
 */
export function generateAudiometryResult() {
  const frequencies = [
    '250', '500', '1000', '2000', '3000', '4000', '6000', '8000',
  ];

  const result: Record<string, { left: string; right: string }> = {};

  frequencies.forEach((freq) => {
    // Generate normal hearing values (0-25 dB)
    const left = Math.floor(Math.random() * 25).toString();
    const right = Math.floor(Math.random() * 25).toString();
    result[`freq_${freq}`] = { left, right };
  });

  return { frequencies: result };
}

/**
 * Eye Test result data
 */
export function generateEyeTestResult() {
  return {
    // Visual acuity
    vaRight: '6/6',
    vaLeft: '6/6',
    vaBoth: '6/6',

    // Color vision
    colorVision: 'Normal',

    // Other parameters
    iopRight: '15',
    iopLeft: '16',

    // Eye health
    rightEye: 'Normal anterior and posterior segment',
    leftEye: 'Normal anterior and posterior segment',

    // Remarks
    remarks: 'No ocular abnormalities detected.',
  };
}

/**
 * Blood test result data
 */
export function generateBloodResult(testType: string) {
  const baseResults = {
    hemoglobin: '14.5',
    hematocrit: '42',
    rbc: '4.8',
    wbc: '7500',
    platelet: '250000',
  };

  switch (testType) {
    case TEST_DEFINITIONS.BLOOD_COMPLETE:
      return baseResults;

    case TEST_DEFINITIONS.BLOOD_LIPID:
      return {
        totalCholesterol: '180',
        hdl: '45',
        ldl: '110',
        triglycerides: '125',
      };

    case TEST_DEFINITIONS.BLOOD_LIVER:
      return {
        sgpt: '25',
        sgot: '28',
        alkalinePhosphatase: '80',
        bilirubinTotal: '0.8',
        bilirubinDirect: '0.2',
        albumin: '4.2',
      };

    case TEST_DEFINITIONS.BLOOD_KIDNEY:
      return {
        creatinine: '0.9',
        bloodUrea: '25',
        uricAcid: '5.2',
        sodium: '140',
        potassium: '4.0',
      };

    case TEST_DEFINITIONS.BLOOD_THYROID:
      return {
        tsh: '2.5',
        t3: '1.2',
        t4: '1.1',
      };

    case TEST_DEFINITIONS.BLOOD_SUGAR:
      return {
        fasting: '95',
        postprandial: '120',
        random: '105',
      };

    case TEST_DEFINITIONS.BLOOD_HBA1C:
      return {
        hba1c: '5.6',
      };

    default:
      return baseResults;
  }
}

/**
 * API helper functions
 * These require authentication tokens
 */

let authToken: string | null = null;

/**
 * Set auth token for API requests
 */
export function setAuthToken(token: string) {
  authToken = token;
}

/**
 * Get auth headers
 */
function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
  };
}

/**
 * Login via API and get token
 */
export async function loginViaAPI(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  const token = data.accessToken || data.access_token;

  if (token) {
    setAuthToken(token);
  }

  return token;
}

/**
 * Create patient via API
 */
export async function createPatientViaAPI(patientData: PatientData): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/patients/register`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(patientData),
  });

  if (!response.ok) {
    throw new Error(`Patient creation failed: ${response.status}`);
  }

  return await response.json();
}

/**
 * Auto-assign tests via API
 */
export async function autoAssignViaAPI(patientId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/assignments/auto-assign/${patientId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Auto-assign failed: ${response.status}`);
  }

  return await response.json();
}

/**
 * Cleanup test data
 * Note: This requires SUPER_ADMIN privileges
 */
export async function cleanupTestData(patientIds: string[]): Promise<void> {
  for (const id of patientIds) {
    try {
      await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.warn(`Failed to delete patient ${id}:`, error);
    }
  }
}
