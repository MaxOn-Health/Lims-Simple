# LIMS - Complete Workflow Map

## 📋 Table of Contents
1. [User Roles & Permissions](#user-roles--permissions)
2. [Authentication Workflow](#authentication-workflow)
3. [Patient Lifecycle Workflow](#patient-lifecycle-workflow)
4. [Order & Assignment Workflow](#order--assignment-workflow)
5. [Technician Workflow](#technician-workflow)
6. [Blood Sample Workflow](#blood-sample-workflow)
7. [Doctor Review & Validation Workflow](#doctor-review--validation-workflow)
8. [Report Generation Workflow](#report-generation-workflow)
9. [User Management Workflow](#user-management-workflow)
10. [Package & Test Management Workflow](#package--test-management-workflow)
11. [Project Management Workflow](#project-management-workflow)
12. [Dashboard Navigation Workflow](#dashboard-navigation-workflow)
13. [Audit Trail Workflow](#audit-trail-workflow)
14. [Workflow Gaps & Unimplemented Features](#workflow-gaps--unimplemented-features)

---

## User Roles & Permissions

### Roles Defined
1. **SUPER_ADMIN**
   - Full system access
   - Manage all users, packages, tests, projects
   - View all reports and audit logs
   - Override result edits
   - System configuration

2. **RECEPTIONIST**
   - Register patients
   - Select packages and addon tests
   - Assign tests to technicians (auto/manual)
   - View patient status and progress
   - Update payment status
   - Generate reports
   - Register blood samples

3. **TEST_TECHNICIAN**
   - View assigned tests in dashboard
   - Update assignment status (ASSIGNED → IN_PROGRESS → COMPLETED → SUBMITTED)
   - Enter test results
   - Submit completed tests
   - View own test history
   - Access project-scoped assignments

4. **LAB_TECHNICIAN**
   - Access blood samples with passcode
   - Enter blood test results
   - Submit lab reports
   - View lab test history
   - Update blood sample status

5. **DOCTOR**
   - View all test results for patients
   - Add clinical remarks
   - Sign reports (with passkey authentication)
   - View patient history
   - Access all test details
   - Setup passkey credentials

---

## Authentication Workflow

### Workflow: User Login
**Status**: ✅ Fully Implemented

**Steps**:
1. User navigates to `/login`
2. User enters email and password
3. Frontend calls `POST /auth/login`
4. Backend validates credentials
5. Backend generates JWT access token and refresh token
6. Frontend stores tokens in localStorage
7. Frontend redirects to `/dashboard`

**Pages/Routes**:
- `/login` - LoginForm component

**Components**:
- `LoginForm` (`src/components/auth/LoginForm/LoginForm.tsx`)
- `AuthLayout` (`src/components/layouts/AuthLayout/AuthLayout.tsx`)

**API Calls**:
- `POST /auth/login` - Login endpoint
- `GET /auth/me` - Get current user (after login)

**Selectors**:
- Email input: `input[name="email"]` or `input[type="email"]`
- Password input: `input[name="password"]` or `input[type="password"]`
- Submit button: `button[type="submit"]` or button with text "Sign In"

**Role Permissions**: Public (no authentication required)

**Workflow Gaps**: None

---

### Workflow: Password Reset
**Status**: ✅ Fully Implemented

**Steps**:
1. User clicks "Forgot Password" on login page
2. Navigates to `/forgot-password`
3. Enters email address
4. Frontend calls `POST /auth/forgot-password`
5. Backend generates reset token and sends email (if email exists)
6. User receives email with reset link
7. User clicks link, navigates to `/reset-password?token=xxx`
8. User enters new password
9. Frontend calls `POST /auth/reset-password`
10. Backend validates token and updates password
11. User redirected to login

**Pages/Routes**:
- `/forgot-password` - ForgotPasswordForm
- `/reset-password` - ResetPasswordForm

**API Calls**:
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

**Selectors**:
- Email input: `input[name="email"]`
- New password input: `input[name="newPassword"]`
- Confirm password input: `input[name="confirmPassword"]`
- Submit button: `button[type="submit"]`

**Role Permissions**: Public

**Workflow Gaps**: None

---

### Workflow: Logout
**Status**: ✅ Fully Implemented

**Steps**:
1. User clicks logout button in header/sidebar
2. Frontend calls `POST /auth/logout`
3. Backend invalidates token (if token blacklist implemented)
4. Frontend clears localStorage tokens
5. Frontend redirects to `/login`

**API Calls**:
- `POST /auth/logout` - Logout endpoint

**Selectors**:
- Logout button: Button with text "Logout" or logout icon

**Role Permissions**: All authenticated users

**Workflow Gaps**: None

---

### Workflow: Token Refresh
**Status**: ✅ Fully Implemented

**Steps**:
1. Access token expires
2. Frontend automatically calls `POST /auth/refresh` with refresh token
3. Backend validates refresh token
4. Backend generates new access token
5. Frontend updates stored access token
6. Original request retried with new token

**API Calls**:
- `POST /auth/refresh` - Refresh access token

**Role Permissions**: All authenticated users

**Workflow Gaps**: None

---

## Patient Lifecycle Workflow

### Workflow: Register New Patient
**Status**: ✅ Fully Implemented

**Steps**:
1. Receptionist navigates to `/patients/new`
2. Fills patient registration form:
   - Name, age, gender, contact number
   - Email (optional), employee ID (optional)
   - Company name (optional), address (optional)
   - Project selection (optional)
   - Package selection OR individual tests
   - Addon tests (optional)
3. Frontend validates form data
4. Frontend calls `POST /patients/register`
5. Backend:
   - Generates unique patient ID (PAT-YYYYMMDD-XXXX)
   - Validates package/tests exist
   - Calculates total price
   - Creates patient record
   - Creates patient_packages record
   - **Auto-assigns tests to technicians** (if available)
   - Logs audit trail
6. Frontend receives patient response
7. Frontend redirects to `/patients/[id]` or shows success message

**Pages/Routes**:
- `/patients/new` - PatientForm component

**Components**:
- `PatientForm` (`src/components/patients/PatientForm/PatientForm.tsx`)
- `PackageSelector`
- `TestSelector`
- `ProjectSelector`

**API Calls**:
- `GET /packages` - Fetch available packages
- `GET /tests` - Fetch available tests
- `GET /projects/active` - Fetch active projects
- `POST /patients/register` - Register patient

**Database Entities**:
- `patients` table
- `patient_packages` table
- `assignments` table (created via auto-assign)

**Selectors**:
- Name input: `input[name="name"]`
- Age input: `input[name="age"]`
- Gender select: `select[name="gender"]`
- Contact input: `input[name="contactNumber"]`
- Package select: `select[name="packageId"]` or package selector component
- Submit button: `button[type="submit"]` or button with text "Register Patient"

**Role Permissions**: RECEPTIONIST, SUPER_ADMIN

**Status Transitions**: N/A (patient created)

**Workflow Gaps**: None

---

### Workflow: View Patient List
**Status**: ✅ Fully Implemented

**Steps**:
1. User navigates to `/patients`
2. Frontend calls `GET /patients` with pagination/filters
3. Backend returns paginated patient list
4. Frontend displays patient table with:
   - Patient ID, Name, Contact, Registration Date
   - Package info, Payment status
   - Quick actions (View, Edit)

**Pages/Routes**:
- `/patients` - PatientList component

**Components**:
- `PatientList` (`src/components/patients/PatientList/PatientList.tsx`)
- `PatientTable`
- `Pagination`

**API Calls**:
- `GET /patients?page=1&limit=10&search=...&dateFrom=...&dateTo=...`

**Selectors**:
- Search input: `input[placeholder*="Search"]` or `input[name="search"]`
- Patient row: `tr[data-patient-id]` or table row
- View button: `button` with text "View" or link to patient detail
- Pagination: `button[aria-label*="page"]` or pagination controls

**Role Permissions**: RECEPTIONIST, SUPER_ADMIN, DOCTOR, TEST_TECHNICIAN, LAB_TECHNICIAN

**Workflow Gaps**: None

---

### Workflow: View Patient Details
**Status**: ✅ Fully Implemented

**Steps**:
1. User clicks on patient from list
2. Navigates to `/patients/[id]`
3. Frontend calls `GET /patients/:id`
4. Backend returns patient details with:
   - Patient info
   - Package info
   - Assignments list
   - Results list
   - Payment status
5. Frontend displays patient detail view

**Pages/Routes**:
- `/patients/[id]` - PatientDetail component

**Components**:
- `PatientDetail` (`src/components/patients/PatientDetail/PatientDetail.tsx`)
- `PatientInfo`
- `AssignmentsList`
- `ResultsList`

**API Calls**:
- `GET /patients/:id` - Get patient by ID
- `GET /assignments/patient/:patientId` - Get patient assignments
- `GET /results/patient/:patientId` - Get patient results

**Selectors**:
- Patient ID display: Element showing patient ID
- Edit button: `button` with text "Edit" or edit icon
- Assignments section: Section with heading "Assignments"
- Results section: Section with heading "Results"

**Role Permissions**: All authenticated users (with role-based data filtering)

**Workflow Gaps**: None

---

### Workflow: Edit Patient
**Status**: ✅ Fully Implemented

**Steps**:
1. User navigates to `/patients/[id]/edit`
2. Frontend loads patient data
3. User modifies patient information
4. Frontend validates changes
5. Frontend calls `PUT /patients/:id`
6. Backend updates patient record
7. Backend logs audit trail
8. Frontend redirects to `/patients/[id]`

**Pages/Routes**:
- `/patients/[id]/edit` - PatientEditForm

**Components**:
- `PatientForm` (reused with edit mode)

**API Calls**:
- `GET /patients/:id` - Load patient data
- `PUT /patients/:id` - Update patient

**Selectors**:
- Form fields: Same as registration form
- Save button: `button[type="submit"]` or button with text "Save Changes"
- Cancel button: `button` with text "Cancel" or link back

**Role Permissions**: RECEPTIONIST, SUPER_ADMIN

**Workflow Gaps**: None

---

### Workflow: Update Payment Status
**Status**: ✅ Fully Implemented

**Steps**:
1. Receptionist views patient detail page
2. Clicks "Update Payment" button
3. Enters payment amount and status
4. Frontend calls `PUT /patients/:id/payment`
5. Backend updates payment status
6. Backend logs audit trail
7. Frontend refreshes patient details

**API Calls**:
- `PUT /patients/:id/payment` - Update payment

**Selectors**:
- Payment status select: `select[name="paymentStatus"]`
- Payment amount input: `input[name="paymentAmount"]`
- Update button: `button` with text "Update Payment"

**Role Permissions**: RECEPTIONIST, SUPER_ADMIN

**Workflow Gaps**: None

---

### Workflow: Track Patient Progress
**Status**: ✅ Fully Implemented

**Steps**:
1. Receptionist navigates to `/patients/progress`
2. Frontend calls `GET /patients/progress` with filters
3. Backend returns patients with progress details:
   - Total tests assigned
   - Tests completed
   - Tests pending
   - Overall completion percentage
4. Frontend displays progress dashboard

**Pages/Routes**:
- `/patients/progress` - PatientProgress component

**API Calls**:
- `GET /patients/progress?page=1&limit=10&search=...`

**Selectors**:
- Progress table: Table showing patient progress
- Progress bar: Progress indicator element
- Filter controls: Search and date filters

**Role Permissions**: RECEPTIONIST, SUPER_ADMIN

**Workflow Gaps**: None

---

## Order & Assignment Workflow

### Workflow: Auto-Assign Tests
**Status**: ✅ Fully Implemented

**Steps**:
1. Receptionist registers patient (triggers auto-assign)
   OR
2. Receptionist navigates to `/assignments/auto-assign`
3. Selects patient
4. Frontend calls `GET /assignments/auto-assign/:patientId/preview`
5. Backend returns preview of assignments to be created
6. Receptionist reviews preview
7. Frontend calls `POST /assignments/auto-assign/:patientId`
8. Backend:
   - Gets patient's package tests + addon tests
   - For each test:
     - Finds available technician (matching testTechnicianType)
     - Considers project membership (if patient has project)
     - Selects technician with least assignments
     - Creates assignment with status PENDING
   - Returns created assignments
9. Frontend displays success message

**Pages/Routes**:
- `/assignments/auto-assign` - AutoAssignPage

**Components**:
- `AutoAssignForm`
- `AssignmentPreview`

**API Calls**:
- `GET /assignments/auto-assign/:patientId/preview` - Preview assignments
- `POST /assignments/auto-assign/:patientId` - Execute auto-assign

**Database Entities**:
- `assignments` table
- `users` table (for technician selection)
- `tests` table (for adminRole matching)

**Selectors**:
- Patient select: `select[name="patientId"]` or patient selector
- Preview button: `button` with text "Preview"
- Confirm button: `button` with text "Confirm Assignment"
- Assignment list: List showing created assignments

**Role Permissions**: RECEPTIONIST, SUPER_ADMIN

**Status Transitions**: Creates assignments with status PENDING

**Workflow Gaps**: None

---

### Workflow: Manual Assign Test
**Status**: ✅ Fully Implemented

**Steps**:
1. Receptionist navigates to `/assignments/manual-assign`
2. Selects patient
3. Selects test
4. Frontend calls `GET /assignments/available-technicians?testId=xxx&projectId=xxx`
5. Backend returns available technicians for that test type
6. Receptionist selects technician from list
7. Frontend calls `POST /assignments/manual-assign`
8. Backend:
   - Validates patient, test, technician exist
   - Validates technician can perform test (testTechnicianType matches)
   - Validates project membership (if applicable)
   - Creates assignment with status ASSIGNED
   - Sets assignedAt timestamp
9. Frontend displays success message

**Pages/Routes**:
- `/assignments/manual-assign` - ManualAssignPage

**Components**:
- `ManualAssignForm`
- `TechnicianSelector`

**API Calls**:
- `GET /assignments/available-technicians?testId=xxx&projectId=xxx` - Get available technicians
- `POST /assignments/manual-assign` - Create manual assignment

**Selectors**:
- Patient select: `select[name="patientId"]`
- Test select: `select[name="testId"]`
- Technician select: `select[name="adminId"]` or technician list
- Assign button: `button` with text "Assign"

**Role Permissions**: RECEPTIONIST, SUPER_ADMIN

**Status Transitions**: Creates assignment with status ASSIGNED

**Workflow Gaps**: None

---

### Workflow: Reassign Assignment
**Status**: ✅ Fully Implemented

**Steps**:
1. Receptionist views assignment list or detail
2. Clicks "Reassign" button
3. Selects new technician
4. Frontend calls `PUT /assignments/:id/reassign`
5. Backend:
   - Validates assignment exists and is not SUBMITTED
   - Validates new technician can perform test
   - Updates assignment adminId
   - Logs audit trail
6. Frontend refreshes assignment list

**API Calls**:
- `GET /assignments/available-technicians` - Get technicians
- `PUT /assignments/:id/reassign` - Reassign

**Selectors**:
- Reassign button: `button` with text "Reassign"
- Technician select: `select[name="adminId"]`
- Confirm button: `button` with text "Confirm Reassignment"

**Role Permissions**: RECEPTIONIST, SUPER_ADMIN

**Status Transitions**: Assignment status unchanged, adminId updated

**Workflow Gaps**: None

---

### Workflow: View All Assignments
**Status**: ✅ Fully Implemented

**Steps**:
1. User navigates to `/assignments`
2. Frontend calls `GET /assignments?status=...&patientId=...&adminId=...`
3. Backend returns filtered assignments
4. Frontend displays assignment table

**Pages/Routes**:
- `/assignments` - AssignmentsListPage

**Components**:
- `AssignmentsList`
- `AssignmentTable`
- `AssignmentFilters`

**API Calls**:
- `GET /assignments` - Get all assignments (with filters)

**Selectors**:
- Status filter: `select[name="status"]`
- Patient filter: `select[name="patientId"]`
- Assignment row: `tr[data-assignment-id]`
- View button: Link to `/assignments/[id]`

**Role Permissions**: RECEPTIONIST, SUPER_ADMIN, DOCTOR

**Workflow Gaps**: None

---

## Technician Workflow

### Workflow: View My Assignments
**Status**: ✅ Fully Implemented

**Steps**:
1. Technician (TEST_TECHNICIAN or LAB_TECHNICIAN) navigates to `/assignments/my-assignments`
2. Frontend calls `GET /assignments/my-assignments?status=...`
3. Backend returns assignments for current user
4. Frontend displays assignment dashboard with:
   - Pending assignments
   - In-progress assignments
   - Completed assignments
5. Technician can filter by status

**Pages/Routes**:
- `/assignments/my-assignments` - MyAssignmentsDashboard

**Components**:
- `MyAssignmentsDashboard` (`src/components/assignments/MyAssignmentsDashboard/MyAssignmentsDashboard.tsx`)
- `AssignmentCard`
- `StatusFilter`

**API Calls**:
- `GET /assignments/my-assignments?status=...` - Get my assignments

**Selectors**:
- Assignment card: `div[data-assignment-id]` or assignment card element
- Status badge: Element showing assignment status
- Start button: `button` with text "Start" or "Begin Test"
- View button: Link to result entry page

**Role Permissions**: TEST_TECHNICIAN, LAB_TECHNICIAN

**Workflow Gaps**: None

---

### Workflow: Update Assignment Status
**Status**: ✅ Fully Implemented

**Steps**:
1. Technician views assignment
2. Clicks "Start" button (ASSIGNED → IN_PROGRESS)
   OR
3. Clicks "Complete" button (IN_PROGRESS → COMPLETED)
4. Frontend calls `PUT /assignments/:id/status`
5. Backend:
   - Validates status transition is allowed
   - Updates assignment status
   - Updates timestamps (startedAt, completedAt)
6. Frontend refreshes assignment list

**API Calls**:
- `PUT /assignments/:id/status` - Update assignment status

**Status Transitions**:
- PENDING → ASSIGNED (via auto-assign or manual assign)
- ASSIGNED → IN_PROGRESS (technician starts work)
- IN_PROGRESS → (no direct transition, must submit result)
- COMPLETED → SUBMITTED (when result is submitted)

**Selectors**:
- Start button: `button` with text "Start" or "Begin"
- Complete button: `button` with text "Complete"
- Status dropdown: `select[name="status"]` (if status update modal)

**Role Permissions**: TEST_TECHNICIAN, LAB_TECHNICIAN (own assignments only)

**Workflow Gaps**: None

---

### Workflow: Enter Test Results
**Status**: ✅ Fully Implemented

**Steps**:
1. Technician navigates to `/results/entry/[assignmentId]`
2. Frontend loads assignment details
3. Frontend loads test details (test parameters, normal ranges)
4. Technician enters test values:
   - For each test parameter, enters value
   - System validates against normal ranges (if applicable)
5. Technician clicks "Submit Result"
6. Frontend calls `POST /results/submit`
7. Backend:
   - Validates assignment exists and belongs to user
   - Validates assignment status is IN_PROGRESS or ASSIGNED
   - Creates result record
   - Updates assignment status to SUBMITTED
   - Sets assignment completedAt timestamp
   - Logs audit trail
8. Frontend displays success message
9. Frontend redirects to `/assignments/my-assignments`

**Pages/Routes**:
- `/results/entry/[assignmentId]` - ResultEntryForm

**Components**:
- `ResultEntryForm` (`src/components/results/ResultEntryForm/ResultEntryForm.tsx`)
- `TestParameterInput`
- `NormalRangeIndicator`

**API Calls**:
- `GET /assignments/:id` - Load assignment details
- `GET /tests/:id` - Load test details
- `POST /results/submit` - Submit result

**Database Entities**:
- `results` table
- `assignments` table (status updated)

**Selectors**:
- Parameter input: `input[name="parameterName"]` or dynamic input fields
- Value input: `input[type="number"]` or `input[type="text"]`
- Submit button: `button[type="submit"]` or button with text "Submit Result"
- Cancel button: `button` with text "Cancel"

**Role Permissions**: TEST_TECHNICIAN, LAB_TECHNICIAN (own assignments only)

**Status Transitions**: Assignment status → SUBMITTED

**Workflow Gaps**: None

---

### Workflow: View Result Details
**Status**: ✅ Fully Implemented

**Steps**:
1. User navigates to `/results/[id]`
2. Frontend calls `GET /results/:id`
3. Backend returns result details
4. Frontend displays result view

**Pages/Routes**:
- `/results/[id]` - ResultDetailPage

**API Calls**:
- `GET /results/:id` - Get result by ID
- `GET /results/assignment/:assignmentId` - Get result by assignment

**Selectors**:
- Result value display: Element showing result values
- Edit button: `button` with text "Edit" (SUPER_ADMIN only)

**Role Permissions**: All authenticated users (with role-based filtering)

**Workflow Gaps**: None

---

### Workflow: Edit Result (Admin Override)
**Status**: ✅ Fully Implemented

**Steps**:
1. SUPER_ADMIN navigates to `/results/[id]/edit`
2. Frontend loads result data
3. SUPER_ADMIN modifies result values
4. Frontend calls `PUT /results/:id`
5. Backend:
   - Updates result record
   - Logs audit trail (with admin override flag)
6. Frontend redirects to result detail

**Pages/Routes**:
- `/results/[id]/edit` - ResultEditForm

**API Calls**:
- `PUT /results/:id` - Update result (SUPER_ADMIN only)

**Selectors**:
- Edit button: `button` with text "Edit"
- Save button: `button[type="submit"]`

**Role Permissions**: SUPER_ADMIN only

**Workflow Gaps**: None

---

## Blood Sample Workflow

### Workflow: Register Blood Sample
**Status**: ✅ Fully Implemented

**Steps**:
1. Receptionist navigates to `/blood-samples/register`
2. Selects patient
3. Selects blood test
4. Frontend calls `POST /blood-samples/register`
5. Backend:
   - Generates unique sample ID (SMP-YYYYMMDD-XXXX)
   - Generates random 6-digit passcode
   - Hashes passcode
   - Creates blood_sample record
   - Creates assignment for blood test (status PENDING, adminId null)
   - Links assignment to sample
   - Logs audit trail
6. Frontend displays sample ID and **plain passcode** (shown only once)
7. Receptionist provides passcode to lab technician

**Pages/Routes**:
- `/blood-samples/register` - RegisterBloodSamplePage

**Components**:
- `BloodSampleRegistrationForm`

**API Calls**:
- `GET /tests?category=lab` - Get lab tests
- `POST /blood-samples/register` - Register sample

**Database Entities**:
- `blood_samples` table
- `assignments` table (created)

**Selectors**:
- Patient select: `select[name="patientId"]`
- Test select: `select[name="testId"]`
- Register button: `button` with text "Register Sample"
- Passcode display: Element showing generated passcode

**Role Permissions**: RECEPTIONIST, SUPER_ADMIN

**Status Transitions**: Sample created with status COLLECTED

**Workflow Gaps**: None

---

### Workflow: Access Blood Sample with Passcode
**Status**: ✅ Fully Implemented

**Steps**:
1. Lab technician navigates to `/blood-samples/access`
2. Enters sample ID and passcode
3. Frontend calls `POST /blood-samples/access`
4. Backend:
   - Finds sample by sample ID
   - Validates passcode hash matches
   - Validates sample status is COLLECTED or IN_LAB
   - Creates blood_sample_access record
   - Updates assignment adminId to current user
   - Updates assignment status to ASSIGNED
   - Updates sample status to IN_LAB
   - Logs access event
5. Frontend redirects to `/blood-samples/[id]`

**Pages/Routes**:
- `/blood-samples/access` - AccessBloodSamplePage

**Components**:
- `BloodSampleAccessForm`

**API Calls**:
- `POST /blood-samples/access` - Access sample with passcode

**Database Entities**:
- `blood_sample_access` table
- `blood_samples` table (status updated)
- `assignments` table (adminId and status updated)

**Selectors**:
- Sample ID input: `input[name="sampleId"]`
- Passcode input: `input[name="passcode"]`
- Access button: `button` with text "Access Sample"

**Role Permissions**: LAB_TECHNICIAN only

**Status Transitions**: 
- Sample: COLLECTED → IN_LAB
- Assignment: PENDING → ASSIGNED (adminId set)

**Workflow Gaps**: None

---

### Workflow: Update Blood Sample Status
**Status**: ✅ Fully Implemented

**Steps**:
1. Lab technician views accessed sample
2. Updates sample status (IN_LAB → TESTED → COMPLETED)
3. Frontend calls `PUT /blood-samples/:id/status`
4. Backend:
   - Validates status transition
   - Updates sample status
   - Logs status change
5. Frontend refreshes sample view

**API Calls**:
- `PUT /blood-samples/:id/status` - Update sample status

**Status Transitions**:
- COLLECTED → IN_LAB (when accessed)
- IN_LAB → TESTED (when testing starts)
- TESTED → COMPLETED (when testing done)

**Selectors**:
- Status select: `select[name="status"]`
- Update button: `button` with text "Update Status"

**Role Permissions**: LAB_TECHNICIAN (accessed samples only)

**Workflow Gaps**: None

---

### Workflow: Submit Blood Test Result
**Status**: ✅ Fully Implemented

**Steps**:
1. Lab technician navigates to `/blood-samples/[id]/result`
2. Frontend loads sample and assignment details
3. Technician enters blood test results
4. Frontend calls `POST /blood-samples/:id/results`
5. Backend:
   - Validates sample is accessed by current user
   - Validates sample status allows result submission
   - Creates result record
   - Updates assignment status to SUBMITTED
   - Updates sample status to COMPLETED
   - Logs audit trail
6. Frontend displays success message

**Pages/Routes**:
- `/blood-samples/[id]/result` - BloodTestResultEntryPage

**Components**:
- `BloodTestResultForm`

**API Calls**:
- `GET /blood-samples/:id` - Load sample details
- `POST /blood-samples/:id/results` - Submit blood test result

**Selectors**:
- Result inputs: Dynamic input fields for test parameters
- Submit button: `button` with text "Submit Result"

**Role Permissions**: LAB_TECHNICIAN (accessed samples only)

**Status Transitions**: 
- Sample: TESTED → COMPLETED
- Assignment: ASSIGNED/IN_PROGRESS → SUBMITTED

**Workflow Gaps**: None

---

### Workflow: View My Blood Samples
**Status**: ✅ Fully Implemented

**Steps**:
1. Lab technician navigates to `/blood-samples`
2. Frontend calls `GET /blood-samples/my-samples?status=...`
3. Backend returns samples accessed by current user
4. Frontend displays sample list

**Pages/Routes**:
- `/blood-samples` - BloodSamplesListPage

**API Calls**:
- `GET /blood-samples/my-samples` - Get my samples

**Selectors**:
- Sample row: `tr[data-sample-id]`
- Status filter: `select[name="status"]`

**Role Permissions**: LAB_TECHNICIAN

**Workflow Gaps**: None

---

## Doctor Review & Validation Workflow

### Workflow: Setup Passkey (Doctor)
**Status**: ✅ Fully Implemented

**Steps**:
1. Doctor navigates to `/doctor/settings/passkey`
2. Clicks "Setup Passkey"
3. Frontend calls `POST /auth/setup-passkey`
4. Backend generates WebAuthn challenge
5. Frontend prompts user for biometric/passkey
6. User authenticates with device
7. Frontend calls `POST /auth/verify-passkey-setup`
8. Backend:
   - Verifies passkey credential
   - Stores credential ID and public key
9. Frontend displays success message

**Pages/Routes**:
- `/doctor/settings/passkey` - PasskeySetupPage

**API Calls**:
- `POST /auth/setup-passkey` - Generate challenge
- `POST /auth/verify-passkey-setup` - Verify and store passkey

**Selectors**:
- Setup button: `button` with text "Setup Passkey"
- Passkey prompt: Browser WebAuthn prompt

**Role Permissions**: DOCTOR only

**Workflow Gaps**: None

---

### Workflow: View Patients for Review
**Status**: ✅ Fully Implemented

**Steps**:
1. Doctor navigates to `/doctor/patients` or `/doctor/dashboard`
2. Frontend calls `GET /doctor/patients?status=PENDING&page=1&limit=10`
3. Backend returns patients with:
   - All tests SUBMITTED
   - No review yet OR review exists but not signed
4. Frontend displays patient list
5. Doctor clicks on patient to review

**Pages/Routes**:
- `/doctor/patients` - DoctorPatientsListPage
- `/doctor/dashboard` - DoctorDashboardPage

**Components**:
- `DoctorPatientsList`
- `PatientCard`

**API Calls**:
- `GET /doctor/patients` - Get patients for review

**Selectors**:
- Patient card: `div[data-patient-id]`
- Review button: `button` with text "Review" or link to review page
- Status filter: `select[name="status"]`

**Role Permissions**: DOCTOR only

**Workflow Gaps**: None

---

### Workflow: Review Patient Results
**Status**: ✅ Fully Implemented

**Steps**:
1. Doctor navigates to `/doctor/patients/[patientId]/review`
2. Frontend calls `GET /doctor/patient/:patientId/results`
3. Backend returns:
   - Patient details
   - All test results
   - Normal/abnormal indicators
   - Previous review (if exists)
4. Doctor reviews all results
5. Doctor adds clinical remarks
6. Doctor clicks "Save Review"
7. Frontend calls `POST /doctor/review`
8. Backend:
   - Validates all tests are SUBMITTED
   - Creates or updates doctor_review record
   - Sets review status to REVIEWED
   - Logs audit trail
9. Frontend displays success message

**Pages/Routes**:
- `/doctor/patients/[patientId]/review` - PatientReviewPage

**Components**:
- `PatientResultsView` (`src/components/doctor/PatientResultsView/PatientResultsView.tsx`)
- `ResultCard`
- `RemarksEditor`

**API Calls**:
- `GET /doctor/patient/:patientId/results` - Get patient results
- `POST /doctor/review` - Create/update review

**Database Entities**:
- `doctor_reviews` table

**Selectors**:
- Remarks textarea: `textarea[name="remarks"]`
- Save review button: `button` with text "Save Review"
- Result cards: Elements showing test results
- Abnormal indicator: Badge or icon showing abnormal values

**Role Permissions**: DOCTOR only

**Status Transitions**: Review status → REVIEWED

**Workflow Gaps**: None

---

### Workflow: Sign Report with Passkey
**Status**: ✅ Fully Implemented

**Steps**:
1. Doctor reviews patient results
2. Doctor clicks "Sign Report"
3. Frontend calls `POST /auth/verify-passkey` (generates challenge)
4. Backend generates WebAuthn challenge
5. Frontend prompts user for passkey authentication
6. User authenticates with device
7. Frontend calls `POST /doctor/sign-report`
8. Backend:
   - Validates passkey verification
   - Validates review exists
   - Updates doctor_review record:
     - Sets signedAt timestamp
     - Sets passkeyVerified flag
     - Sets review status to SIGNED
   - Logs audit trail
9. Frontend displays success message
10. Report can now be generated

**API Calls**:
- `POST /auth/verify-passkey` - Verify passkey for signing
- `POST /doctor/sign-report` - Sign report

**Selectors**:
- Sign button: `button` with text "Sign Report"
- Passkey prompt: Browser WebAuthn prompt

**Role Permissions**: DOCTOR only

**Status Transitions**: Review status → SIGNED

**Workflow Gaps**: None

---

### Workflow: View Signed Reports
**Status**: ✅ Fully Implemented

**Steps**:
1. Doctor navigates to `/doctor/signed-reports`
2. Frontend calls `GET /doctor/signed-reports?page=1&limit=10`
3. Backend returns signed reports
4. Frontend displays signed reports list

**Pages/Routes**:
- `/doctor/signed-reports` - SignedReportsPage

**API Calls**:
- `GET /doctor/signed-reports` - Get signed reports

**Selectors**:
- Signed report row: `tr[data-report-id]`
- View button: Link to report detail

**Role Permissions**: DOCTOR only

**Workflow Gaps**: None

---

## Report Generation Workflow

### Workflow: Generate Report
**Status**: ✅ Fully Implemented

**Steps**:
1. User (any role) navigates to patient detail or reports page
2. User clicks "Generate Report"
3. Frontend calls `POST /reports/generate/:patientId`
4. Backend:
   - Validates patient exists
   - Validates all tests are SUBMITTED
   - Validates doctor review is SIGNED (if required)
   - Generates report number (RPT-YYYYMMDD-XXXX)
   - Creates report record (status GENERATING)
   - Generates PDF report:
     - Patient information
     - All test results
     - Doctor remarks
     - Doctor signature
     - Report date
   - Saves PDF to file system
   - Updates report record:
     - Sets pdfUrl
     - Sets status to COMPLETED
   - Logs audit trail
5. Frontend receives report response
6. Frontend displays success message

**Pages/Routes**:
- `/reports/generate` - GenerateReportPage
- `/patients/[id]` - Patient detail (has generate button)

**Components**:
- `ReportGenerator`
- `ReportPreview`

**API Calls**:
- `POST /reports/generate/:patientId` - Generate report

**Database Entities**:
- `reports` table

**Selectors**:
- Generate button: `button` with text "Generate Report"
- Report status: Element showing report status
- Download button: Link to download PDF

**Role Permissions**: RECEPTIONIST, SUPER_ADMIN, DOCTOR, TEST_TECHNICIAN, LAB_TECHNICIAN

**Status Transitions**: Report status: PENDING → GENERATING → COMPLETED

**Workflow Gaps**: None

---

### Workflow: View Report
**Status**: ✅ Fully Implemented

**Steps**:
1. User navigates to `/reports/[id]`
2. Frontend calls `GET /reports/:id`
3. Backend returns report details
4. Frontend displays report view

**Pages/Routes**:
- `/reports/[id]` - ReportDetailPage

**API Calls**:
- `GET /reports/:id` - Get report by ID
- `GET /reports/patient/:patientId` - Get report by patient

**Selectors**:
- Report content: Element showing report content
- Download button: `button` with text "Download PDF"

**Role Permissions**: All authenticated users

**Workflow Gaps**: None

---

### Workflow: Download Report PDF
**Status**: ✅ Fully Implemented

**Steps**:
1. User clicks "Download PDF" on report detail page
2. Frontend calls `GET /reports/:id/download`
3. Backend:
   - Validates report exists
   - Validates PDF file exists
   - Streams PDF file
4. Frontend downloads PDF file

**API Calls**:
- `GET /reports/:id/download` - Download PDF

**Selectors**:
- Download button: `button` with text "Download PDF" or download icon
- Download link: `a[href*="/download"]`

**Role Permissions**: All authenticated users

**Workflow Gaps**: None

---

### Workflow: View All Reports
**Status**: ✅ Fully Implemented

**Steps**:
1. User navigates to `/reports`
2. Frontend calls `GET /reports?page=1&limit=10&status=...&dateFrom=...&dateTo=...`
3. Backend returns paginated reports
4. Frontend displays reports list

**Pages/Routes**:
- `/reports` - ReportsListPage

**API Calls**:
- `GET /reports` - Get all reports (with filters)

**Selectors**:
- Report row: `tr[data-report-id]`
- Status filter: `select[name="status"]`
- Date filters: Date input fields

**Role Permissions**: RECEPTIONIST, SUPER_ADMIN, DOCTOR, TEST_TECHNICIAN, LAB_TECHNICIAN

**Workflow Gaps**: None

---

## User Management Workflow

### Workflow: Create User
**Status**: ✅ Fully Implemented

**Steps**:
1. SUPER_ADMIN navigates to `/users/new`
2. Fills user creation form:
   - Email, password, full name
   - Role selection
   - Test technician type (if role is TEST_TECHNICIAN)
   - Active status
3. Frontend calls `POST /users`
4. Backend:
   - Validates email is unique
   - Hashes password
   - Creates user record
   - Logs audit trail
5. Frontend redirects to `/users/[id]`

**Pages/Routes**:
- `/users/new` - UserCreatePage

**Components**:
- `UserForm`

**API Calls**:
- `POST /users` - Create user

**Selectors**:
- Email input: `input[name="email"]`
- Password input: `input[name="password"]`
- Role select: `select[name="role"]`
- Test technician type select: `select[name="testTechnicianType"]`
- Create button: `button` with text "Create User"

**Role Permissions**: SUPER_ADMIN only

**Workflow Gaps**: None

---

### Workflow: View Users List
**Status**: ✅ Fully Implemented

**Steps**:
1. SUPER_ADMIN navigates to `/users`
2. Frontend calls `GET /users?page=1&limit=10&role=...&search=...`
3. Backend returns paginated users
4. Frontend displays users table

**Pages/Routes**:
- `/users` - UsersListPage

**API Calls**:
- `GET /users` - Get all users

**Selectors**:
- User row: `tr[data-user-id]`
- Role filter: `select[name="role"]`
- Search input: `input[name="search"]`

**Role Permissions**: SUPER_ADMIN only

**Workflow Gaps**: None

---

### Workflow: Edit User
**Status**: ✅ Fully Implemented

**Steps**:
1. SUPER_ADMIN navigates to `/users/[id]/edit`
2. Frontend loads user data
3. SUPER_ADMIN modifies user information
4. Frontend calls `PUT /users/:id`
5. Backend:
   - Validates changes
   - Updates user record
   - Logs audit trail
6. Frontend redirects to `/users/[id]`

**Pages/Routes**:
- `/users/[id]/edit` - UserEditPage

**API Calls**:
- `GET /users/:id` - Load user
- `PUT /users/:id` - Update user

**Selectors**:
- Edit button: `button` with text "Edit"
- Save button: `button` with text "Save Changes"

**Role Permissions**: SUPER_ADMIN (full edit), Users (limited: own profile, name/email only)

**Workflow Gaps**: None

---

### Workflow: Change Password
**Status**: ✅ Fully Implemented

**Steps**:
1. User navigates to `/users/[id]/change-password`
2. Enters current password and new password
3. Frontend calls `POST /users/:id/change-password`
4. Backend:
   - Validates current password (unless SUPER_ADMIN changing for others)
   - Hashes new password
   - Updates password
   - Logs audit trail
5. Frontend displays success message

**Pages/Routes**:
- `/users/[id]/change-password` - ChangePasswordPage

**API Calls**:
- `POST /users/:id/change-password` - Change password

**Selectors**:
- Current password input: `input[name="currentPassword"]`
- New password input: `input[name="newPassword"]`
- Confirm password input: `input[name="confirmPassword"]`
- Change button: `button` with text "Change Password"

**Role Permissions**: Users (own password), SUPER_ADMIN (any user's password)

**Workflow Gaps**: None

---

### Workflow: Delete User
**Status**: ✅ Fully Implemented

**Steps**:
1. SUPER_ADMIN navigates to user detail page
2. Clicks "Delete User"
3. Confirms deletion
4. Frontend calls `DELETE /users/:id`
5. Backend:
   - Validates user is not self
   - Soft deletes user (sets deletedAt)
   - Logs audit trail
6. Frontend redirects to `/users`

**API Calls**:
- `DELETE /users/:id` - Delete user (soft delete)

**Selectors**:
- Delete button: `button` with text "Delete User"
- Confirm button: `button` with text "Confirm Delete" (in modal)

**Role Permissions**: SUPER_ADMIN only

**Workflow Gaps**: None

---

## Package & Test Management Workflow

### Workflow: Create Package
**Status**: ✅ Fully Implemented

**Steps**:
1. SUPER_ADMIN navigates to `/packages/new`
2. Fills package form:
   - Name, description
   - Price, validity days
   - Active status
3. Frontend calls `POST /packages`
4. Backend:
   - Validates name is unique
   - Creates package record
   - Logs audit trail
5. Frontend redirects to `/packages/[id]`

**Pages/Routes**:
- `/packages/new` - PackageCreatePage

**API Calls**:
- `POST /packages` - Create package

**Selectors**:
- Name input: `input[name="name"]`
- Price input: `input[name="price"]`
- Create button: `button` with text "Create Package"

**Role Permissions**: SUPER_ADMIN only

**Workflow Gaps**: None

---

### Workflow: Add Tests to Package
**Status**: ✅ Fully Implemented

**Steps**:
1. SUPER_ADMIN navigates to `/packages/[id]/tests`
2. Views available tests
3. Selects tests to add
4. Frontend calls `POST /packages/:id/tests`
5. Backend:
   - Validates test exists
   - Validates test not already in package
   - Creates package_test record
   - Logs audit trail
6. Frontend refreshes package tests list

**Pages/Routes**:
- `/packages/[id]/tests` - PackageTestsPage

**API Calls**:
- `GET /packages/:id/tests` - Get package tests
- `POST /packages/:id/tests` - Add test to package
- `DELETE /packages/:id/tests/:testId` - Remove test from package

**Selectors**:
- Test select: `select[name="testId"]` or test selector
- Add button: `button` with text "Add Test"
- Remove button: `button` with text "Remove" (for each test)

**Role Permissions**: SUPER_ADMIN only

**Workflow Gaps**: None

---

### Workflow: Create Test
**Status**: ✅ Fully Implemented

**Steps**:
1. SUPER_ADMIN navigates to `/tests/new`
2. Fills test form:
   - Name, description
   - Category (on_site or lab)
   - Admin role (testTechnicianType)
   - Normal range (min/max)
   - Unit
   - Active status
3. Frontend calls `POST /tests`
4. Backend:
   - Validates name is unique
   - Creates test record
   - Logs audit trail
5. Frontend redirects to `/tests/[id]`

**Pages/Routes**:
- `/tests/new` - TestCreatePage

**API Calls**:
- `POST /tests` - Create test

**Selectors**:
- Name input: `input[name="name"]`
- Category select: `select[name="category"]`
- Admin role input: `input[name="adminRole"]`
- Create button: `button` with text "Create Test"

**Role Permissions**: SUPER_ADMIN only

**Workflow Gaps**: None

---

### Workflow: View Packages/Tests
**Status**: ✅ Fully Implemented

**Steps**:
1. User navigates to `/packages` or `/tests`
2. Frontend calls `GET /packages` or `GET /tests`
3. Backend returns list
4. Frontend displays table

**Pages/Routes**:
- `/packages` - PackagesListPage
- `/tests` - TestsListPage

**API Calls**:
- `GET /packages` - Get all packages
- `GET /tests` - Get all tests

**Selectors**:
- Package/test row: `tr[data-package-id]` or `tr[data-test-id]`
- View button: Link to detail page

**Role Permissions**: All authenticated users (view), SUPER_ADMIN (edit/delete)

**Workflow Gaps**: None

---

## Project Management Workflow

### Workflow: Create Project
**Status**: ✅ Fully Implemented

**Steps**:
1. SUPER_ADMIN navigates to `/projects/new`
2. Fills project form:
   - Name, description
   - Company name
   - Start date, end date
   - Status (PLANNING, ACTIVE, COMPLETED, CANCELLED)
3. Frontend calls `POST /projects`
4. Backend:
   - Validates name is unique
   - Creates project record
   - Logs audit trail
5. Frontend redirects to `/projects/[id]`

**Pages/Routes**:
- `/projects/new` - ProjectCreatePage

**API Calls**:
- `POST /projects` - Create project

**Selectors**:
- Name input: `input[name="name"]`
- Company input: `input[name="companyName"]`
- Create button: `button` with text "Create Project"

**Role Permissions**: SUPER_ADMIN only

**Workflow Gaps**: None

---

### Workflow: Add Project Members
**Status**: ✅ Fully Implemented

**Steps**:
1. Project Lead or SUPER_ADMIN navigates to `/projects/[id]`
2. Clicks "Add Member"
3. Selects user and role (LEAD, MEMBER)
4. Frontend calls `POST /projects/:id/members`
5. Backend:
   - Validates user exists
   - Validates user not already member
   - Creates project_member record
   - Logs audit trail
6. Frontend refreshes members list

**Pages/Routes**:
- `/projects/[id]` - ProjectDetailPage

**API Calls**:
- `GET /projects/:id/members` - Get project members
- `POST /projects/:id/members` - Add member
- `DELETE /projects/:id/members/:userId` - Remove member

**Selectors**:
- Add member button: `button` with text "Add Member"
- User select: `select[name="userId"]`
- Role select: `select[name="role"]`
- Remove button: `button` with text "Remove" (for each member)

**Role Permissions**: SUPER_ADMIN, Project Lead

**Workflow Gaps**: None

---

### Workflow: View Projects
**Status**: ✅ Fully Implemented

**Steps**:
1. User navigates to `/projects`
2. Frontend calls `GET /projects?page=1&limit=10&status=...`
3. Backend returns projects (filtered by membership if not SUPER_ADMIN)
4. Frontend displays projects list

**Pages/Routes**:
- `/projects` - ProjectsListPage

**API Calls**:
- `GET /projects` - Get all projects
- `GET /projects/active` - Get active projects

**Selectors**:
- Project row: `tr[data-project-id]`
- Status filter: `select[name="status"]`

**Role Permissions**: All authenticated users (filtered by membership)

**Workflow Gaps**: None

---

## Dashboard Navigation Workflow

### Workflow: Role-Based Dashboard
**Status**: ✅ Fully Implemented

**Steps**:
1. User logs in
2. Frontend redirects to `/dashboard`
3. Frontend calls `GET /dashboard/stats?projectId=...`
4. Backend returns role-specific statistics:
   - **RECEPTIONIST**: Patients today, pending payments, registrations
   - **TEST_TECHNICIAN/LAB_TECHNICIAN**: My pending tasks, completed today
   - **DOCTOR**: Reports to review, reports signed today
   - **SUPER_ADMIN**: All statistics
5. Frontend displays dashboard with:
   - Stat cards
   - Quick actions
   - Role-specific activity

**Pages/Routes**:
- `/dashboard` - DashboardPage

**Components**:
- `DashboardPage` (`src/app/dashboard/page.tsx`)
- `StatCard`
- `QuickActions`
- `ProjectSelector`

**API Calls**:
- `GET /dashboard/stats?projectId=...` - Get dashboard stats

**Selectors**:
- Stat card: `div[data-stat-card]` or stat card element
- Quick action link: Link element in quick actions section
- Project selector: `select[name="projectId"]` or project selector component

**Role Permissions**: All authenticated users

**Workflow Gaps**: None

---

### Workflow: Sidebar Navigation
**Status**: ✅ Fully Implemented

**Navigation Items by Role**:

**All Roles**:
- Dashboard (`/dashboard`)

**RECEPTIONIST, SUPER_ADMIN, DOCTOR**:
- Patients (`/patients`)
- Track Status (`/patients/progress`)

**RECEPTIONIST, SUPER_ADMIN**:
- Pending Tests (`/assignments`)
- Packages (`/packages`)
- Tests (`/tests`)
- Reports (`/reports`)
- Projects (`/projects`)

**TEST_TECHNICIAN, LAB_TECHNICIAN**:
- My Tasks (`/assignments/my-assignments`)

**LAB_TECHNICIAN**:
- Blood Samples (`/blood-samples`)

**DOCTOR**:
- Patients (`/doctor/patients`)
- Signed Reports (`/doctor/signed-reports`)

**SUPER_ADMIN**:
- Users (`/users`)
- Audit Logs (`/audit-logs`)

**Components**:
- `Sidebar` (`src/components/common/Sidebar/Sidebar.tsx`)

**Selectors**:
- Navigation link: `a[href="/path"]` or nav item with href
- Active nav item: Element with active class or aria-current

**Workflow Gaps**: None

---

## Audit Trail Workflow

### Workflow: View Audit Logs
**Status**: ✅ Fully Implemented

**Steps**:
1. SUPER_ADMIN navigates to `/audit-logs`
2. Applies filters (user, action, entity type, date range)
3. Frontend calls `GET /audit-logs?user_id=...&action=...&entity_type=...&date_from=...&date_to=...&page=1&limit=10`
4. Backend returns filtered audit logs
5. Frontend displays audit log table

**Pages/Routes**:
- `/audit-logs` - AuditLogsPage
- `/audit-logs/entity/[entityType]/[entityId]` - EntityAuditTrailPage

**Components**:
- `AuditLogsList`
- `AuditLogTable`
- `AuditFilters`

**API Calls**:
- `GET /audit-logs` - Get audit logs
- `GET /audit-logs/entity/:entityType/:entityId` - Get entity audit trail

**Selectors**:
- User filter: `select[name="user_id"]`
- Action filter: `select[name="action"]`
- Entity type filter: `select[name="entity_type"]`
- Date from input: `input[name="date_from"]`
- Date to input: `input[name="date_to"]`
- Audit log row: `tr[data-audit-log-id]`

**Role Permissions**: SUPER_ADMIN only

**Workflow Gaps**: None

---

## Workflow Gaps & Unimplemented Features

### Coming Soon Features

1. **Settings Page** (`/settings`)
   - Status: ❌ Not Implemented
   - Shows "Coming Soon" message
   - File: `lims-frontend/src/app/settings/page.tsx`

2. **Test Orders Page** (`/test-orders`)
   - Status: ❌ Not Implemented
   - Shows "Coming Soon" message
   - File: `lims-frontend/src/app/test-orders/page.tsx`

3. **Test Results Page** (`/test-results`)
   - Status: ❌ Not Implemented
   - Shows "Coming Soon" message
   - File: `lims-frontend/src/app/test-results/page.tsx`
   - Note: Individual result viewing exists at `/results/[id]`, but bulk results page is missing

4. **Two-Factor Authentication**
   - Status: ❌ Not Implemented
   - Shows "Coming Soon" in SecuritySettings component
   - File: `lims-frontend/src/components/security/SecuritySettings/SecuritySettings.tsx`

5. **API Key Management**
   - Status: ❌ Not Implemented
   - Shows "Coming Soon" in SecuritySettings component
   - File: `lims-frontend/src/components/security/SecuritySettings/SecuritySettings.tsx`

### Partially Implemented Features

1. **Result Editing**
   - Status: ⚠️ Partially Implemented
   - Only SUPER_ADMIN can edit results
   - Technicians cannot edit submitted results
   - No "draft" or "save for later" functionality

2. **Assignment Status Transitions**
   - Status: ⚠️ Partially Implemented
   - Missing: Direct transition from IN_PROGRESS to SUBMITTED
   - Current flow requires: IN_PROGRESS → COMPLETED → SUBMITTED
   - Technicians must manually update status to COMPLETED before submitting result

3. **Blood Sample Workflow**
   - Status: ✅ Fully Implemented
   - All core flows working
   - Minor gap: No bulk sample registration

### Missing Workflow Features

1. **Bulk Operations**
   - Bulk patient registration
   - Bulk assignment creation
   - Bulk result submission

2. **Notifications System**
   - Real-time notifications for new assignments
   - Email notifications for completed tests
   - SMS notifications (not planned)

3. **Report Templates**
   - Customizable report templates
   - Multiple report formats
   - Report scheduling

4. **Advanced Search**
   - Full-text search across all entities
   - Advanced filtering options
   - Saved search queries

5. **Export Functionality**
   - Export patients to CSV/Excel
   - Export reports in bulk
   - Export audit logs

6. **Workflow Automation**
   - Automated assignment rules
   - Automated status transitions
   - Automated report generation triggers

---

## Data Flow Summary

### Complete Patient Journey

1. **Registration** (`POST /patients/register`)
   - Creates patient → Creates patient_package → Auto-creates assignments

2. **Assignment** (`POST /assignments/auto-assign` or `POST /assignments/manual-assign`)
   - Creates assignment with status PENDING or ASSIGNED

3. **Technician Work** (`PUT /assignments/:id/status`)
   - Updates status: ASSIGNED → IN_PROGRESS → COMPLETED

4. **Result Submission** (`POST /results/submit`)
   - Creates result → Updates assignment status to SUBMITTED

5. **Doctor Review** (`POST /doctor/review`)
   - Creates/updates doctor_review → Sets status to REVIEWED

6. **Report Signing** (`POST /doctor/sign-report`)
   - Updates doctor_review → Sets status to SIGNED (with passkey)

7. **Report Generation** (`POST /reports/generate/:patientId`)
   - Creates report → Generates PDF → Sets status to COMPLETED

### Blood Test Journey

1. **Sample Registration** (`POST /blood-samples/register`)
   - Creates blood_sample → Creates assignment (adminId null)

2. **Sample Access** (`POST /blood-samples/access`)
   - Creates blood_sample_access → Updates assignment adminId → Updates sample status

3. **Result Submission** (`POST /blood-samples/:id/results`)
   - Creates result → Updates assignment status → Updates sample status

---

## Selector Reference Guide

### Common Selectors

**Forms**:
- `input[name="fieldName"]` - Form input fields
- `select[name="fieldName"]` - Dropdown selects
- `textarea[name="fieldName"]` - Text areas
- `button[type="submit"]` - Submit buttons
- `form` - Form elements

**Tables**:
- `tr[data-entity-id]` - Table rows with entity IDs
- `td` - Table cells
- `th` - Table headers

**Navigation**:
- `a[href="/path"]` - Navigation links
- `nav` - Navigation containers
- `button` with text content - Action buttons

**Modals**:
- `[role="dialog"]` - Modal dialogs
- `button` with text "Close" or "Cancel" - Modal close buttons

**Status Indicators**:
- `[data-status]` - Elements with status attributes
- `.badge`, `.status-badge` - Status badges
- `[aria-label*="status"]` - Accessible status labels

---

## API Endpoint Summary

### Authentication
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Get current user
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `POST /auth/setup-passkey` - Setup passkey (DOCTOR)
- `POST /auth/verify-passkey-setup` - Verify passkey setup
- `POST /auth/verify-passkey` - Verify passkey for signing

### Patients
- `POST /patients/register` - Register patient
- `GET /patients` - Get all patients
- `GET /patients/progress` - Get patient progress
- `GET /patients/:id` - Get patient by ID
- `GET /patients/by-patient-id/:patientId` - Get by patient ID
- `PUT /patients/:id` - Update patient
- `PUT /patients/:id/payment` - Update payment

### Assignments
- `GET /assignments/auto-assign/:patientId/preview` - Preview auto-assign
- `POST /assignments/auto-assign/:patientId` - Auto-assign tests
- `POST /assignments/manual-assign` - Manual assign
- `PUT /assignments/:id/reassign` - Reassign
- `GET /assignments` - Get all assignments
- `GET /assignments/available-technicians` - Get available technicians
- `GET /assignments/patient/:patientId` - Get patient assignments
- `GET /assignments/my-assignments` - Get my assignments
- `PUT /assignments/:id/status` - Update status
- `GET /assignments/:id` - Get assignment by ID

### Results
- `POST /results/submit` - Submit result
- `GET /results/assignment/:assignmentId` - Get by assignment
- `GET /results/patient/:patientId` - Get patient results
- `GET /results/:id` - Get result by ID
- `PUT /results/:id` - Update result (SUPER_ADMIN)
- `POST /results/:id/verify` - Verify result (SUPER_ADMIN)

### Blood Samples
- `GET /blood-samples` - Get all samples (SUPER_ADMIN)
- `GET /blood-samples/my-samples` - Get my samples (LAB_TECHNICIAN)
- `POST /blood-samples/register` - Register sample
- `POST /blood-samples/access` - Access with passcode
- `PUT /blood-samples/:id/status` - Update status
- `GET /blood-samples/:id` - Get sample by ID
- `POST /blood-samples/:id/results` - Submit blood test result

### Doctor Reviews
- `GET /doctor/patients` - Get patients for review
- `GET /doctor/patient/:patientId/results` - Get patient results
- `POST /doctor/review` - Create/update review
- `POST /doctor/sign-report` - Sign report
- `GET /doctor/signed-reports` - Get signed reports

### Reports
- `POST /reports/generate/:patientId` - Generate report
- `GET /reports/patient/:patientId` - Get report by patient
- `GET /reports/:id` - Get report by ID
- `GET /reports/:id/download` - Download PDF
- `GET /reports` - Get all reports

### Users
- `POST /users` - Create user (SUPER_ADMIN)
- `GET /users` - Get all users (SUPER_ADMIN)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user (SUPER_ADMIN)
- `POST /users/:id/change-password` - Change password

### Packages
- `POST /packages` - Create package (SUPER_ADMIN)
- `GET /packages` - Get all packages
- `GET /packages/:id` - Get package by ID
- `PUT /packages/:id` - Update package (SUPER_ADMIN)
- `DELETE /packages/:id` - Delete package (SUPER_ADMIN)
- `POST /packages/:id/tests` - Add test to package (SUPER_ADMIN)
- `DELETE /packages/:id/tests/:testId` - Remove test (SUPER_ADMIN)
- `GET /packages/:id/tests` - Get package tests

### Tests
- `POST /tests` - Create test (SUPER_ADMIN)
- `GET /tests` - Get all tests
- `GET /tests/:id` - Get test by ID
- `PUT /tests/:id` - Update test (SUPER_ADMIN)
- `DELETE /tests/:id` - Delete test (SUPER_ADMIN)
- `GET /tests/by-admin-role/:adminRole` - Get tests by admin role

### Projects
- `POST /projects` - Create project (SUPER_ADMIN)
- `GET /projects` - Get all projects
- `GET /projects/active` - Get active projects
- `GET /projects/:id` - Get project by ID
- `PATCH /projects/:id` - Update project (SUPER_ADMIN or Lead)
- `PATCH /projects/:id/status` - Update status (SUPER_ADMIN)
- `DELETE /projects/:id` - Delete project (SUPER_ADMIN)
- `GET /projects/:id/members` - Get project members
- `POST /projects/:id/members` - Add member (SUPER_ADMIN or Lead)
- `DELETE /projects/:id/members/:userId` - Remove member (SUPER_ADMIN or Lead)
- `GET /projects/user/:userId/projects` - Get user projects

### Dashboard
- `GET /dashboard/stats?projectId=...` - Get dashboard statistics

### Audit
- `GET /audit-logs` - Get audit logs (SUPER_ADMIN)
- `GET /audit-logs/entity/:entityType/:entityId` - Get entity audit trail (SUPER_ADMIN)

---

## End of Workflow Map

This document provides a comprehensive overview of all workflows, pages, API endpoints, and selectors in the LIMS system. Use this as a reference for testing, development, and documentation purposes.

