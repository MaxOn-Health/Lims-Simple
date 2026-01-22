# LIMS E2E Testing Setup

This directory contains the end-to-end testing infrastructure for the LIMS application using Playwright.

## Prerequisites

1. **Backend server running** on `http://localhost:3000`
2. **Super Admin account exists** with credentials:
   - Email: `admin@lims.com`
   - Password: `Admin@123` (or set via env vars)

## Initial Setup

### 1. Install Dependencies

```bash
cd lims-frontend
npm install
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Create Test Users

Run the setup script to create test users via the Super Admin account:

```bash
npm run test:setup-users
```

This script:
- Logs in as Super Admin
- Creates test users for all roles (RECEPTIONIST, TEST_TECHNICIAN, LAB_TECHNICIAN, DOCTOR)
- Saves credentials to `e2e/config/test-users.json`

**Environment Variables (optional):**
```bash
export API_BASE_URL=http://localhost:3000
export SUPER_ADMIN_EMAIL=admin@lims.com
export SUPER_ADMIN_PASSWORD=Admin@123
npm run test:setup-users
```

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run with UI Mode
```bash
npm run test:e2e:ui
```

### Run in Debug Mode
```bash
npm run test:e2e:debug
```

### Run in Headed Mode (see browser)
```bash
npm run test:e2e:headed
```

### Run Specific Browser
```bash
npm run test:e2e:chromium
```

### View HTML Report
```bash
npm run test:e2e:report
```

## Project Structure

```
e2e/
├── fixtures/
│   └── auth.fixture.ts       # Authenticated user fixtures
├── helpers/
│   ├── testData.ts           # Test data generators
│   └── setupTestUsers.ts     # Script to create test users
├── pages/
│   ├── BasePage.ts           # Base page with common utilities
│   ├── LoginPage.ts          # Login page object
│   ├── PatientRegistrationPage.ts
│   ├── AssignmentsPage.ts
│   ├── ResultEntryPage.ts
│   └── DoctorReviewPage.ts
├── tests/
│   ├── auth/
│   │   └── login.spec.ts
│   ├── patients/
│   │   └── patient-registration.spec.ts
│   ├── technician/
│   │   └── technician-workflow.spec.ts
│   └── doctor/
│       └── doctor-review.spec.ts
├── config/
│   └── test-users.json       # Generated test user credentials
├── playwright.config.ts      # Playwright configuration
└── README.md
```

## Test Users Created

The setup script creates the following users:

| Role | Email Pattern | Purpose |
|------|---------------|---------|
| SUPER_ADMIN | `admin@lims.com` | Default admin (pre-existing) |
| RECEPTIONIST | `e2e-*-receptionist@lims.test` | Patient registration |
| TEST_TECHNICIAN (X-Ray) | `e2e-*-xray-tech@lims.test` | X-Ray tests |
| TEST_TECHNICIAN (Audiometry) | `e2e-*-audio-tech@lims.test` | Audiometry tests |
| TEST_TECHNICIAN (Eye) | `e2e-*-eye-tech@lims.test` | Eye tests |
| TEST_TECHNICIAN (PFT) | `e2e-*-pft-tech@lims.test` | PFT tests |
| TEST_TECHNICIAN (ECG) | `e2e-*-ecg-tech@lims.test` | ECG tests |
| LAB_TECHNICIAN | `e2e-*-lab-tech@lims.test` | Blood tests |
| DOCTOR | `e2e-*-doctor@lims.test` | Review & signing |

All test users use the password: `E2E@Test@123`

## Writing Tests

### Using Pre-configured Fixtures

```typescript
import { testWithAuth, expect } from '../../fixtures/auth.fixture';

testWithAuth('test as receptionist', async ({ asReceptionist }) => {
  // Already logged in as receptionist
  await asReceptionist.goto('/patients');
});
```

### Using Dynamic Role Fixture

```typescript
import { testAsRole } from '../../fixtures/auth.fixture';

testAsRole('test as specific role', async ({ page, asRole }) => {
  // Login as any role dynamically
  const technicianPage = await asRole('TEST_TECHNICIAN', 'xray');
  await technicianPage.goto('/assignments/my-assignments');
});
```

### Using TEST_USERS Directly

```typescript
import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../../fixtures/auth.fixture';
import { LoginPage } from '../../pages/LoginPage';

test('manual login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(TEST_USERS.RECEPTIONIST.email, TEST_USERS.RECEPTIONIST.password);
});
```

## Page Object Model

Each major page has a corresponding page object class:

```typescript
import { PatientRegistrationPage } from '../pages/PatientRegistrationPage';

const registrationPage = new PatientRegistrationPage(page);
await registrationPage.goto();
await registrationPage.fillPatientDetails({
  name: 'John Doe',
  age: 30,
  gender: 'Male',
  contactNumber: '9123456789',
  email: 'john@example.com',
  address: '123 Main St',
});
await registrationPage.selectTest('X-Ray Chest');
const result = await registrationPage.register();
```

## Test Data Generators

Use helper functions to generate test data:

```typescript
import {
  generatePatientData,
  generateXRayResult,
  generateAudiometryResult,
  generateEyeTestResult,
  TEST_DEFINITIONS,
} from '../helpers/testData';

const patient = generatePatientData();
const xrayResult = generateXRayResult();
```

## Troubleshooting

### Tests fail with "User not found"

Run the setup script:
```bash
npm run test:setup-users
```

### Backend connection issues

Ensure the backend is running:
```bash
cd lims-backend
npm run start:dev
```

### Tests timeout

Increase timeout in `playwright.config.ts` or specific test:
```typescript
test.setTimeout(180000); // 3 minutes
```

### "Test users config not found" warning

The fixtures fall back to the Super Admin user if config is missing. Run `npm run test:setup-users`.

## CI/CD Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Setup E2E Users
  run: npm run test:setup-users
  env:
    API_BASE_URL: http://localhost:3000
    SUPER_ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
    SUPER_ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}

- name: Run E2E Tests
  run: npm run test:e2e
```
