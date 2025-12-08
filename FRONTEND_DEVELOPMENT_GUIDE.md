# LIMS Frontend Development Guide
## Frontend-First Integration - MVP Core Features

---

## Table of Contents
1. [Development Approach](#development-approach)
2. [Technology Stack & Setup](#technology-stack--setup)
3. [Project Structure](#project-structure)
4. [Phase 1: Foundation & Authentication UI](#phase-1-foundation--authentication-ui)
5. [Phase 2: User Management & RBAC UI](#phase-2-user-management--rbac-ui)
6. [Phase 3: Package & Test Management UI](#phase-3-package--test-management-ui)
7. [Phase 4: Patient Registration UI](#phase-4-patient-registration-ui)
8. [Phase 5: Test Assignment UI](#phase-5-test-assignment-ui)
9. [Phase 6: Test Result Entry UI](#phase-6-test-result-entry-ui)
10. [Phase 7: Blood Test Workflow UI](#phase-7-blood-test-workflow-ui)
11. [Phase 8: Doctor Review & Signing UI](#phase-8-doctor-review--signing-ui)
12. [Phase 9: Report Generation & Viewing UI](#phase-9-report-generation--viewing-ui)
13. [Phase 10: Audit Trail & Security UI](#phase-10-audit-trail--security-ui)
14. [UI/UX Requirements](#uiux-requirements)
15. [Testing Requirements](#testing-requirements)
16. [Deployment Checklist](#deployment-checklist)

---

## Development Approach

### Frontend-Backend Integration Strategy
- Build frontend that consumes complete backend API
- All backend endpoints must be integrated
- Use TypeScript for type safety
- Implement proper error handling and loading states
- Responsive design for all screen sizes
- Progressive enhancement approach
- Each phase must be complete and tested before moving to next

### Development Principles
1. **Component-Driven Development**: Build reusable components
2. **API-First Integration**: Integrate endpoints as backend completes
3. **Error Handling**: User-friendly error messages
4. **Validation**: Client-side validation matching backend
5. **Security**: Secure token storage, XSS prevention
6. **Accessibility**: WCAG 2.1 AA compliance
7. **Performance**: Optimize bundle size, lazy loading

---

## Technology Stack & Setup

### Required Technologies
- **Framework**: React 18+ with Next.js 14+ (or React with Vite)
- **Language**: TypeScript 5+
- **State Management**: Zustand or Redux Toolkit
- **API Client**: Axios or React Query/TanStack Query
- **Routing**: React Router (or Next.js App Router)
- **Form Handling**: React Hook Form + Zod
- **UI Components**: Material-UI (MUI) or Ant Design or Tailwind CSS + Headless UI
- **Authentication**: JWT token management
- **Passkey**: WebAuthn API
- **PDF Viewer**: react-pdf or PDF.js
- **Date Handling**: date-fns or dayjs
- **Validation**: Zod or Yup
- **Testing**: Jest + React Testing Library + Playwright/Cypress
- **Build Tool**: Vite or Next.js built-in
- **Code Quality**: ESLint + Prettier + Husky

### Project Structure
```
src/
  components/
    common/
      Button/
      Input/
      Modal/
      Table/
      Loading/
      ErrorBoundary/
    auth/
      LoginForm/
      LogoutButton/
    users/
      UserList/
      UserForm/
      UserCard/
    packages/
      PackageList/
      PackageForm/
      PackageCard/
    tests/
      TestList/
      TestForm/
      TestCard/
    patients/
      PatientList/
      PatientForm/
      PatientCard/
      PatientSearch/
    assignments/
      AssignmentList/
      AssignmentCard/
      AssignmentStatus/
    results/
      ResultForm/
      ResultView/
      ResultCard/
    blood-samples/
      SampleRegistration/
      SampleAccess/
      SampleList/
    doctor-reviews/
      ReviewForm/
      PatientResults/
      SignReport/
    reports/
      ReportList/
      ReportView/
      ReportDownload/
    audit/
      AuditLogList/
      AuditLogView/
  pages/
    auth/
      Login/
      Logout/
    dashboard/
      AdminDashboard/
      ReceptionistDashboard/
      TestAdminDashboard/
      LabTechDashboard/
      DoctorDashboard/
    users/
      UserList/
      UserCreate/
      UserEdit/
      UserView/
    packages/
      PackageList/
      PackageCreate/
      PackageEdit/
      PackageView/
    tests/
      TestList/
      TestCreate/
      TestEdit/
      TestView/
    patients/
      PatientList/
      PatientRegister/
      PatientEdit/
      PatientView/
    assignments/
      AssignmentList/
      AssignmentView/
      MyAssignments/
    results/
      ResultSubmit/
      ResultView/
      ResultList/
    blood-samples/
      SampleRegister/
      SampleAccess/
      SampleList/
    doctor-reviews/
      PatientList/
      PatientResults/
      ReviewForm/
      SignReport/
    reports/
      ReportList/
      ReportView/
      ReportDownload/
  hooks/
    useAuth/
    useApi/
    usePagination/
    useForm/
    useDebounce/
  services/
    api/
      auth.service.ts
      users.service.ts
      packages.service.ts
      tests.service.ts
      patients.service.ts
      assignments.service.ts
      results.service.ts
      blood-samples.service.ts
      doctor-reviews.service.ts
      reports.service.ts
      audit.service.ts
    storage/
      token.storage.ts
      cache.storage.ts
  store/
    auth.store.ts
    user.store.ts
    ui.store.ts
  types/
    api.types.ts
    user.types.ts
    patient.types.ts
    test.types.ts
    assignment.types.ts
    result.types.ts
    report.types.ts
  utils/
    validation/
    formatting/
    constants/
    helpers/
  guards/
    ProtectedRoute/
    RoleGuard/
  layouts/
    MainLayout/
    AuthLayout/
    DashboardLayout/
  styles/
    themes/
    globals.css
```

---

## Phase 1: Foundation & Authentication UI

### Objectives
- Set up React/Next.js project structure
- Configure routing and navigation
- Implement authentication UI
- Create login/logout functionality
- Set up API client with interceptors
- Implement token management

### Tasks

#### 1.1 Project Setup
- Initialize React/Next.js project with TypeScript
- Configure environment variables (.env files)
- Set up API base URL configuration
- Configure routing (React Router or Next.js App Router)
- Set up state management (Zustand/Redux)
- Configure ESLint, Prettier, and Husky
- Set up UI component library
- Configure build and dev scripts

#### 1.2 API Client Setup
**Create API Service Layer:**
- Base API client with Axios/React Query
- Request interceptor: Add auth token to headers
- Response interceptor: Handle errors globally
- Token refresh logic
- Error handling and retry logic
- Base URL configuration

**API Client Structure:**
```typescript
// services/api/api.client.ts
- configure base URL
- add request interceptors
- add response interceptors
- handle token refresh
- handle errors (401, 403, 500, etc.)
```

#### 1.3 Authentication UI Components
**Create Auth Components:**

- **Login Page** (`/login`)
  - Email and password input fields
  - Form validation
  - Submit button with loading state
  - Error message display
  - "Remember me" checkbox (optional)
  - Forgot password link (future)
  - Redirect to dashboard on success
  - Store tokens securely

- **Logout Component**
  - Logout button in header/navbar
  - Clear tokens and user data
  - Redirect to login page
  - Show confirmation dialog (optional)

- **Protected Route Component**
  - Check authentication status
  - Redirect to login if not authenticated
  - Show loading state during check

#### 1.4 Token Management
**Implement Token Storage:**
- Store access token securely (httpOnly cookie or localStorage)
- Store refresh token securely
- Token expiration handling
- Auto-refresh token before expiration
- Clear tokens on logout
- Handle token refresh failures

**Token Service:**
```typescript
// services/storage/token.storage.ts
- setAccessToken()
- getAccessToken()
- setRefreshToken()
- getRefreshToken()
- clearTokens()
- isTokenExpired()
- refreshAccessToken()
```

#### 1.5 Auth Store/Context
**Create Authentication State:**
- User information state
- Authentication status
- Login action
- Logout action
- Token refresh action
- Current user getter

**Auth Store Example:**
```typescript
// store/auth.store.ts
- user: User | null
- isAuthenticated: boolean
- isLoading: boolean
- login(email, password)
- logout()
- refreshToken()
- getCurrentUser()
```

#### 1.6 Error Handling
**Global Error Handling:**
- Error boundary component
- API error interceptor
- User-friendly error messages
- Error logging (optional)
- Retry mechanism for network errors

**Error Types:**
- Network errors
- Authentication errors (401)
- Authorization errors (403)
- Validation errors (400)
- Server errors (500)
- Not found errors (404)

#### 1.7 Loading States
**Loading Indicators:**
- Global loading spinner
- Button loading states
- Page loading skeletons
- Inline loading indicators
- Progress indicators for long operations

#### 1.8 Form Validation
**Client-Side Validation:**
- Email format validation
- Password strength validation
- Required field validation
- Real-time validation feedback
- Error message display
- Match backend validation rules

#### 1.9 Testing Requirements
- Unit tests for auth components
- Integration tests for login flow
- E2E tests for authentication
- Test token storage
- Test error handling
- Test protected routes

### Deliverables
- ✅ Working login/logout UI
- ✅ Token management functional
- ✅ Protected routes working
- ✅ API client configured
- ✅ Error handling implemented
- ✅ Loading states implemented
- ✅ Responsive design
- ✅ All tests passing

---

## Phase 2: User Management & RBAC UI

### Objectives
- Create user management interface
- Implement role-based UI rendering
- Create user CRUD operations UI
- Implement user list with pagination
- Add user search and filtering

### Tasks

#### 2.1 User List Page
**Create User List Component:**
- Table/grid view of users
- Pagination controls
- Search functionality (name, email)
- Filter by role
- Filter by active status
- Sort by name, email, role, created date
- Actions: View, Edit, Delete
- Bulk actions (optional)
- Export to CSV (optional)

**Features:**
- Responsive table (mobile-friendly)
- Loading skeleton
- Empty state
- Error state
- Refresh button

#### 2.2 User Create/Edit Form
**Create User Form Component:**
- Form fields:
  - Full Name (required)
  - Email (required, unique)
  - Password (required for create, optional for edit)
  - Role dropdown (required)
  - Test Admin Type (conditional, if role is TEST_ADMIN)
  - Is Active checkbox
- Form validation matching backend
- Submit button with loading state
- Cancel button
- Success/error notifications
- Redirect on success

**Role Selection:**
- Dropdown with all roles
- Conditional field for test_admin_type
- Disable role change for non-super-admin
- Show role description

#### 2.3 User View Page
**Create User Detail Component:**
- Display user information
- Show user role and permissions
- Display creation/update timestamps
- Show associated data (if any)
- Action buttons: Edit, Delete, Change Password
- Activity history (future)

#### 2.4 Change Password Component
**Create Password Change Form:**
- Current password field
- New password field
- Confirm password field
- Password strength indicator
- Show password requirements
- Validation matching backend
- Success/error handling

#### 2.5 Role-Based UI Rendering
**Implement Role Guards:**
- Hide/show UI elements based on role
- Disable actions based on permissions
- Show role-specific navigation
- Conditional rendering of features

**Role-Based Components:**
```typescript
// components/common/RoleGuard.tsx
- Check user role
- Render children if authorized
- Show message if unauthorized
```

#### 2.6 User Search & Filter
**Search Functionality:**
- Search by name
- Search by email
- Real-time search with debounce
- Highlight search results
- Clear search button

**Filter Options:**
- Filter by role
- Filter by active status
- Filter by test admin type
- Combine multiple filters
- Reset filters button

#### 2.7 Pagination Component
**Pagination Features:**
- Page number display
- Previous/Next buttons
- Page size selector
- Total count display
- Jump to page (optional)
- URL-based pagination (optional)

#### 2.8 Testing Requirements
- Test user list rendering
- Test user creation form
- Test user edit form
- Test role-based rendering
- Test search and filtering
- Test pagination
- Test form validation
- Test error handling

### Deliverables
- ✅ Complete user management UI
- ✅ Role-based UI rendering
- ✅ User CRUD operations working
- ✅ Search and filtering functional
- ✅ Pagination working
- ✅ Responsive design
- ✅ All tests passing

---

## Phase 3: Package & Test Management UI

### Objectives
- Create package management interface
- Create test management interface
- Implement package-test linking UI
- Add package/test CRUD operations
- Implement search and filtering

### Tasks

#### 3.1 Package List Page
**Create Package List Component:**
- Grid/table view of packages
- Display: name, description, price, validity days
- Show active/inactive status
- Actions: View, Edit, Delete, Manage Tests
- Search by name
- Filter by active status
- Sort by name, price, created date
- Pagination

**Package Card Component:**
- Package name (heading)
- Description (truncated)
- Price display
- Validity period
- Active badge
- Action buttons
- Test count badge

#### 3.2 Package Create/Edit Form
**Create Package Form Component:**
- Form fields:
  - Name (required, unique)
  - Description (optional)
  - Price (required, number)
  - Validity Days (required, number)
  - Is Active (checkbox)
- Form validation
- Success/error handling
- Redirect on success

#### 3.3 Package Detail Page
**Create Package View Component:**
- Display package information
- Show associated tests list
- Add test to package button
- Remove test from package button
- Edit package button
- Delete package button
- Show test count
- Show total package value

#### 3.4 Manage Package Tests
**Create Package Tests Manager:**
- List of tests in package
- List of available tests (not in package)
- Add test to package
  - Select test from dropdown
  - Optional: override test price
  - Add button
- Remove test from package
  - Remove button with confirmation
- Reorder tests (optional)
- Search tests

#### 3.5 Test List Page
**Create Test List Component:**
- Table/grid view of tests
- Display: name, category, admin role, normal range
- Show active/inactive status
- Actions: View, Edit, Delete
- Search by name
- Filter by category (on_site, lab)
- Filter by admin role
- Filter by active status
- Sort by name, category, created date
- Pagination

#### 3.6 Test Create/Edit Form
**Create Test Form Component:**
- Basic Information:
  - Name (required, unique)
  - Description (optional)
  - Category (required, dropdown: on_site, lab)
  - Admin Role (required, dropdown)
- Normal Range:
  - Min value (optional, number)
  - Max value (optional, number)
  - Unit (optional, text)
- Test Fields (Dynamic):
  - Add field button
  - Field name (required)
  - Field type (required, dropdown: number, text, select, boolean, date)
  - Required checkbox
  - Options (conditional, if type is select)
  - Remove field button
- Is Active checkbox
- Form validation
- Preview test fields
- Success/error handling

**Test Fields Builder:**
- Dynamic form array
- Add/remove fields
- Field type selection
- Options input for select type
- Validation for each field

#### 3.7 Test Detail Page
**Create Test View Component:**
- Display test information
- Show test fields structure
- Show normal range
- Show which packages include this test
- Edit test button
- Delete test button
- Usage statistics (optional)

#### 3.8 Testing Requirements
- Test package list rendering
- Test package creation form
- Test package-test linking
- Test test list rendering
- Test test creation form
- Test dynamic test fields builder
- Test search and filtering
- Test validation

### Deliverables
- ✅ Complete package management UI
- ✅ Complete test management UI
- ✅ Package-test linking working
- ✅ CRUD operations functional
- ✅ Search and filtering working
- ✅ Dynamic test fields builder
- ✅ Responsive design
- ✅ All tests passing

---

## Phase 4: Patient Registration UI

### Objectives
- Create patient registration interface
- Implement patient list with search
- Add patient detail view
- Implement payment status management
- Create patient ID display

### Tasks

#### 4.1 Patient Registration Form
**Create Patient Registration Component:**
- Personal Information:
  - Name (required)
  - Age (required, number)
  - Gender (required, dropdown: MALE, FEMALE, OTHER)
  - Contact Number (required, format validation)
  - Email (optional, format validation)
  - Employee ID (optional)
  - Company Name (optional)
  - Address (optional, textarea)
- Package Selection:
  - Package dropdown (required)
  - Show package details on selection
  - Display package price
- Addon Tests:
  - Multi-select dropdown for tests
  - Show selected tests
  - Display addon test prices
  - Calculate total price dynamically
- Price Summary:
  - Package price
  - Addon tests total
  - Grand total
- Form validation
- Submit button with loading
- Success notification with patient ID
- Print receipt option (optional)

**Price Calculation Display:**
- Real-time price update
- Breakdown of costs
- Total price highlight
- Payment status selection (optional)

#### 4.2 Patient List Page
**Create Patient List Component:**
- Table view of patients
- Columns:
  - Patient ID (link to detail)
  - Name
  - Age, Gender
  - Contact Number
  - Package Name
  - Payment Status (badge)
  - Registration Date
  - Actions (View, Edit, Update Payment)
- Search functionality:
  - Search by name
  - Search by patient ID
  - Search by contact number
  - Search by employee ID
- Filters:
  - Filter by payment status
  - Filter by registration date range
  - Filter by package
- Sort options
- Pagination
- Export to CSV (optional)
- Bulk actions (optional)

**Patient ID Display:**
- Highlight patient ID
- Copy to clipboard button
- QR code generation (optional)

#### 4.3 Patient Detail Page
**Create Patient View Component:**
- Patient Information Section:
  - Patient ID (prominent)
  - Personal details
  - Contact information
  - Company information (if applicable)
- Package Information:
  - Package name and details
  - Addon tests list
  - Total price
  - Payment status and amount
- Registration Information:
  - Registered by (user name)
  - Registration date
  - Last updated date
- Actions:
  - Edit Patient
  - Update Payment
  - View Assignments
  - View Results
  - Generate Report (if ready)
- Related Data:
  - Assignments count
  - Results count
  - Reports count

#### 4.4 Patient Edit Form
**Create Patient Edit Component:**
- Pre-filled form with existing data
- Same fields as registration
- Disable patient ID (immutable)
- Disable package selection (immutable)
- Allow editing personal information
- Allow editing addon tests (with validation)
- Recalculate price if addon tests change
- Update button
- Cancel button

#### 4.5 Payment Status Update
**Create Payment Update Component:**
- Current payment status display
- Payment status dropdown:
  - PENDING
  - PAID
  - PARTIAL
- Payment amount input:
  - Required for PAID (must equal total)
  - Required for PARTIAL (must be less than total)
  - Disabled for PENDING (must be 0)
- Total price display
- Remaining amount calculation
- Validation matching backend
- Update button
- Success notification

**Payment Status Badge:**
- Color-coded badges
- PENDING: Yellow/Gray
- PAID: Green
- PARTIAL: Orange

#### 4.6 Patient Search Component
**Create Advanced Search:**
- Search bar with autocomplete
- Multiple search criteria
- Search by patient ID (exact match)
- Search by name (partial match)
- Search by contact (partial match)
- Search by employee ID (exact match)
- Recent searches (optional)
- Quick filters

#### 4.7 Testing Requirements
- Test patient registration form
- Test price calculation
- Test patient ID generation display
- Test patient list with search
- Test patient detail view
- Test payment status update
- Test form validation
- Test error handling

### Deliverables
- ✅ Complete patient registration UI
- ✅ Patient list with search working
- ✅ Patient detail view functional
- ✅ Payment status management working
- ✅ Price calculation accurate
- ✅ Responsive design
- ✅ All tests passing

---

## Phase 5: Test Assignment UI

### Objectives
- Create assignment management interface
- Implement auto-assignment UI
- Add manual assignment interface
- Create admin dashboard for assignments
- Implement assignment status tracking

### Tasks

#### 5.1 Auto-Assignment Interface
**Create Auto-Assignment Component:**
- Patient selection/search
- Display patient's package and tests
- Show tests that need assignment
- Auto-assign button
- Loading state during assignment
- Success message with assignment count
- View assignments button
- Error handling

**Assignment Preview:**
- List of tests to be assigned
- Show which admin will be assigned (if available)
- Show tests that can't be assigned (no admin available)
- Warning messages

#### 5.2 Manual Assignment Interface
**Create Manual Assignment Component:**
- Patient selection
- Test selection (from patient's package/addons)
- Admin selection (filtered by test admin type)
- Assign button
- Success notification
- Error handling

**Admin Selection:**
- Filter admins by test admin type
- Show admin's current assignment count
- Show admin availability
- Display admin name and email

#### 5.3 Assignment List Page
**Create Assignment List Component:**
- Table view of assignments
- Columns:
  - Patient Name/ID
  - Test Name
  - Assigned Admin
  - Status (badge)
  - Assigned Date
  - Completed Date (if applicable)
  - Actions
- Filters:
  - Filter by patient
  - Filter by test
  - Filter by admin
  - Filter by status
- Search functionality
- Sort options
- Pagination

**Status Badges:**
- PENDING: Gray
- ASSIGNED: Blue
- IN_PROGRESS: Yellow
- COMPLETED: Green
- SUBMITTED: Purple

#### 5.4 Assignment Detail View
**Create Assignment View Component:**
- Assignment Information:
  - Patient details (link)
  - Test details (link)
  - Assigned admin (link)
  - Status with timeline
  - Dates (assigned, started, completed)
- Actions:
  - Reassign (if not submitted)
  - Update Status (if admin owns assignment)
  - View Result (if submitted)
- Status History (optional)
- Related Data:
  - Test result (if exists)
  - Patient's other assignments

#### 5.5 My Assignments Dashboard
**Create Admin Dashboard Component:**
- Filter by status tabs:
  - All
  - Assigned
  - In Progress
  - Completed
- Assignment cards/list:
  - Patient name and ID
  - Test name
  - Status
  - Assigned date
  - Action buttons
- Quick actions:
  - Start Test button (ASSIGNED → IN_PROGRESS)
  - Complete Test button (IN_PROGRESS → COMPLETED)
  - Submit Result button (COMPLETED → SUBMITTED)
- Statistics:
  - Total assignments
  - By status counts
  - Completion rate

**Assignment Card Component:**
- Patient information
- Test information
- Status badge
- Priority indicator (optional)
- Action buttons
- Due date (optional)

#### 5.6 Reassignment Interface
**Create Reassignment Component:**
- Current admin display
- Available admins list
- Filter by test admin type
- Show admin workload
- Reassign button
- Confirmation dialog
- Success notification

#### 5.7 Status Update Interface
**Create Status Update Component:**
- Current status display
- Available status transitions
- Status dropdown
- Update button
- Confirmation (if needed)
- Success notification

**Status Transition Rules:**
- ASSIGNED → IN_PROGRESS (admin can do)
- IN_PROGRESS → COMPLETED (admin can do)
- COMPLETED → SUBMITTED (after result submission)
- Show only valid transitions

#### 5.8 Testing Requirements
- Test auto-assignment flow
- Test manual assignment
- Test reassignment
- Test status updates
- Test assignment list
- Test admin dashboard
- Test filtering and search
- Test error handling

### Deliverables
- ✅ Complete assignment management UI
- ✅ Auto-assignment working
- ✅ Manual assignment functional
- ✅ Admin dashboard working
- ✅ Status tracking functional
- ✅ Responsive design
- ✅ All tests passing

---

## Phase 6: Test Result Entry UI

### Objectives
- Create result entry interface
- Implement dynamic form based on test fields
- Add result validation UI
- Create result viewing interface
- Implement result verification UI

### Tasks

#### 6.1 Result Entry Form
**Create Dynamic Result Form Component:**
- Load test field definitions
- Generate form fields dynamically based on test.test_fields
- Field types:
  - Number: Number input with validation
  - Text: Text input/textarea
  - Select: Dropdown with options
  - Boolean: Checkbox
  - Date: Date picker
- Field validation:
  - Required field validation
  - Type validation
  - Normal range validation (for numbers)
  - Show warnings if outside normal range
- Notes field (optional)
- Submit button
- Cancel button
- Loading state
- Success notification

**Dynamic Form Builder:**
- Render fields based on test.test_fields array
- Apply validation rules
- Show field labels
- Show required indicators
- Show help text (if available)
- Real-time validation feedback

#### 6.2 Normal Range Validation UI
**Create Range Validation Component:**
- Display normal range (min - max unit)
- Show current value
- Visual indicator:
  - Green: Within range
  - Yellow: Warning (near limits)
  - Red: Outside range
- Range slider visualization (optional)
- Warning message if outside range
- Allow submission with warning

**Range Display:**
- Show min and max values
- Show unit
- Highlight if value is outside range
- Tooltip with explanation

#### 6.3 Result View Component
**Create Result Display Component:**
- Result Information:
  - Test name
  - Patient name/ID
  - Entered by (admin name)
  - Entered date
  - Verified status (if verified)
- Result Values:
  - Display all result values
  - Show field labels
  - Format values appropriately
  - Show normal range comparison
  - Highlight abnormal values
- Notes section
- Status indicators
- Action buttons:
  - Edit (if super admin)
  - Verify (if super admin)
  - Print (optional)

#### 6.4 Result List Page
**Create Result List Component:**
- Table view of results
- Columns:
  - Patient Name/ID
  - Test Name
  - Result Summary (key values)
  - Status (Normal/Abnormal)
  - Entered By
  - Entered Date
  - Verified Status
  - Actions
- Filters:
  - Filter by patient
  - Filter by test
  - Filter by status
  - Filter by verified status
- Search functionality
- Sort options
- Pagination

#### 6.5 Result Verification Interface
**Create Verification Component:**
- Result display (read-only)
- Verify button
- Confirmation dialog
- Success notification
- Update verified status display

#### 6.6 Result Edit Interface (Super Admin Only)
**Create Result Edit Form:**
- Pre-filled form with existing values
- Same validation as entry form
- Show change history (optional)
- Update button
- Cancel button
- Confirmation dialog
- Success notification

#### 6.7 Patient Results View
**Create Patient Results Component:**
- Patient information header
- All results for patient:
  - Grouped by test
  - Show result values
  - Show status (Normal/Abnormal)
  - Show dates
  - Show verification status
- Summary statistics (optional)
- Export to PDF (optional)
- Print option

#### 6.8 Testing Requirements
- Test dynamic form generation
- Test field type rendering
- Test validation rules
- Test normal range validation
- Test result submission
- Test result viewing
- Test result editing (super admin)
- Test result verification

### Deliverables
- ✅ Complete result entry UI
- ✅ Dynamic form builder working
- ✅ Normal range validation functional
- ✅ Result viewing working
- ✅ Result verification functional
- ✅ Responsive design
- ✅ All tests passing

---

## Phase 7: Blood Test Workflow UI

### Objectives
- Create blood sample registration interface
- Implement passcode access interface
- Add sample status tracking UI
- Create lab technician dashboard
- Implement result submission for blood tests

### Tasks

#### 7.1 Sample Registration Interface
**Create Sample Registration Component:**
- Patient selection/search
- Register button
- Loading state
- Success message with:
  - Sample ID (prominent)
  - Passcode (prominent, show only once)
  - Print option
  - Copy to clipboard buttons
- Warning: Passcode shown only once
- Generate QR code (optional)

**Sample ID & Passcode Display:**
- Large, readable font
- Copy buttons
- Print receipt option
- QR code for sample ID (optional)
- Warning message about passcode

#### 7.2 Sample Access Interface
**Create Passcode Access Component:**
- Sample ID input
- Passcode input (6 digits, masked)
- Access button
- Loading state
- Error handling:
  - Invalid sample ID
  - Invalid passcode
  - Sample already accessed
- Success: Show sample details
- Redirect to sample view

**Passcode Input:**
- 6-digit input
- Masked input (dots or asterisks)
- Auto-focus next field
- Show/hide toggle (optional)
- Clear button

#### 7.3 Lab Technician Dashboard
**Create Lab Tech Dashboard:**
- My Samples List:
  - Filter by status tabs
  - Sample cards/list
  - Sample ID
  - Patient name
  - Status
  - Collection date
  - Action buttons
- Statistics:
  - Total samples
  - By status counts
  - Today's samples
- Quick Actions:
  - Access new sample
  - View all samples

**Sample Status Flow:**
- COLLECTED → IN_LAB → TESTED → COMPLETED
- Visual status indicator
- Status update buttons
- Progress bar

#### 7.4 Sample List Page
**Create Sample List Component:**
- Table view of samples
- Columns:
  - Sample ID
  - Patient Name/ID
  - Status (badge)
  - Collected Date
  - Collected By
  - Tested Date (if tested)
  - Tested By (if tested)
  - Actions
- Filters:
  - Filter by status
  - Filter by date range
  - Filter by patient
- Search by sample ID or patient
- Sort options
- Pagination

#### 7.5 Sample Detail View
**Create Sample View Component:**
- Sample Information:
  - Sample ID (prominent)
  - Status with timeline
  - Collection information
  - Testing information (if tested)
- Patient Information:
  - Patient details
  - Link to patient profile
- Actions:
  - Update Status
  - Submit Result (if tested)
  - View Result (if submitted)
- Status History

#### 7.6 Status Update Interface
**Create Status Update Component:**
- Current status display
- Status dropdown (valid transitions only)
- Update button
- Confirmation (if needed)
- Success notification

**Status Transitions:**
- COLLECTED → IN_LAB (on access)
- IN_LAB → TESTED (when testing starts)
- TESTED → COMPLETED (when result submitted)

#### 7.7 Blood Test Result Submission
**Create Blood Result Form:**
- Same as regular result form
- Pre-filled with test information
- Dynamic form based on test fields
- Normal range validation
- Submit button
- On success: Update sample status to COMPLETED
- Success notification

#### 7.8 Testing Requirements
- Test sample registration
- Test passcode display and security
- Test passcode access
- Test status updates
- Test result submission
- Test lab tech dashboard
- Test sample list
- Test error handling

### Deliverables
- ✅ Complete blood sample workflow UI
- ✅ Sample registration working
- ✅ Passcode access functional
- ✅ Lab tech dashboard working
- ✅ Status tracking functional
- ✅ Result submission working
- ✅ Responsive design
- ✅ All tests passing

---

## Phase 8: Doctor Review & Signing UI

### Objectives
- Create doctor dashboard
- Implement patient results viewing interface
- Add review and remarks interface
- Implement passkey setup UI
- Create report signing interface

### Tasks

#### 8.1 Doctor Dashboard
**Create Doctor Dashboard Component:**
- Patients Ready for Review:
  - List of patients with all tests submitted
  - Patient name/ID
  - Number of tests
  - Submission date
  - Review button
- Review Status Tabs:
  - Pending Review
  - Reviewed (not signed)
  - Signed
- Statistics:
  - Total pending reviews
  - Total reviewed today
  - Total signed today
- Quick Actions:
  - View all patients
  - Search patients

**Patient Card for Review:**
- Patient information
- Test completion status
- Review status
- Action buttons
- Priority indicator (optional)

#### 8.2 Patient Results View
**Create Patient Results Component:**
- Patient Information Header:
  - Patient details
  - Package information
  - Registration date
- All Test Results:
  - Grouped by test category
  - Test name
  - Result values
  - Normal range comparison
  - Status (Normal/Abnormal)
  - Entered date
  - Notes
- Blood Sample Information (if applicable):
  - Sample ID
  - Collection date
  - Test status
- Review Section:
  - Current remarks (if reviewed)
  - Edit remarks button
  - Sign report button (if reviewed)

**Result Display:**
- Clear, readable format
- Highlight abnormal values
- Show normal ranges
- Visual indicators
- Expandable sections (optional)

#### 8.3 Review Form Component
**Create Review Form:**
- Remarks textarea:
  - Rich text editor (optional)
  - Character count
  - Placeholder with suggestions
  - Auto-save draft (optional)
- Save Review button
- Sign Report button (if passkey set up)
- Cancel button
- Success notification

**Remarks Editor:**
- Multi-line text input
- Character limit (optional)
- Formatting options (optional)
- Template suggestions (optional)

#### 8.4 Passkey Setup Interface
**Create Passkey Setup Component:**
- Setup Passkey button
- Instructions:
  - What is a passkey
  - Why it's secure
  - How to set it up
- Setup flow:
  - Click setup button
  - Browser prompts for biometric/security key
  - Success message
  - Test verification
- Status indicator:
  - Not set up
  - Set up (with date)
- Change passkey option

**WebAuthn Integration:**
- Use WebAuthn API
- Handle browser prompts
- Error handling
- Success confirmation

#### 8.5 Report Signing Interface
**Create Sign Report Component:**
- Review Summary:
  - Patient information
  - Test results summary
  - Remarks preview
- Signing Instructions
- Sign Button:
  - Triggers WebAuthn prompt
  - Loading state
  - Success confirmation
- After Signing:
  - Success message
  - Report generation notification
  - View report button
  - Download report button (when ready)

**Signing Flow:**
1. Click Sign Report button
2. WebAuthn challenge
3. User authenticates (biometric/security key)
4. Signature verified
5. Report marked as signed
6. Auto-generate report (background)

#### 8.6 Signed Reports List
**Create Signed Reports Component:**
- List of signed reports
- Columns:
  - Patient Name/ID
  - Signed Date
  - Report Number (if generated)
  - Report Status
  - Actions (View, Download)
- Filters:
  - Filter by date range
  - Filter by report status
- Search functionality
- Sort options
- Pagination

#### 8.7 Testing Requirements
- Test doctor dashboard
- Test patient results view
- Test review form
- Test passkey setup
- Test report signing
- Test WebAuthn integration
- Test signed reports list
- Test error handling

### Deliverables
- ✅ Complete doctor dashboard
- ✅ Patient results view working
- ✅ Review form functional
- ✅ Passkey setup working
- ✅ Report signing functional
- ✅ WebAuthn integration working
- ✅ Responsive design
- ✅ All tests passing

---

## Phase 9: Report Generation & Viewing UI

### Objectives
- Create report list interface
- Implement report viewing interface
- Add PDF download functionality
- Create report generation status tracking
- Add report search and filtering

### Tasks

#### 9.1 Report List Page
**Create Report List Component:**
- Table view of reports
- Columns:
  - Report Number
  - Patient Name/ID
  - Generated Date
  - Status (badge)
  - Doctor Name
  - Actions (View, Download)
- Filters:
  - Filter by status (PENDING, GENERATING, COMPLETED, FAILED)
  - Filter by date range
  - Filter by patient
  - Filter by doctor
- Search by report number or patient
- Sort options
- Pagination
- Export list (optional)

**Status Badges:**
- PENDING: Yellow
- GENERATING: Blue (with spinner)
- COMPLETED: Green
- FAILED: Red

#### 9.2 Report Generation Interface
**Create Report Generation Component:**
- Patient selection
- Check readiness:
  - All tests submitted ✓
  - Doctor review exists ✓
  - Doctor has signed ✓
- Generate button
- Loading state with progress
- Success notification
- Error handling
- Auto-refresh status

**Readiness Checklist:**
- Visual checklist
- Show missing items (if not ready)
- Disable generate button if not ready
- Show error messages

#### 9.3 Report View Component
**Create Report Viewer:**
- PDF viewer integration
- Report information:
  - Report number
  - Patient information
  - Generated date
  - Doctor information
- Actions:
  - Download PDF
  - Print
  - Share (optional)
- Loading state
- Error handling (if PDF fails to load)

**PDF Viewer Options:**
- Use react-pdf or PDF.js
- Zoom controls
- Page navigation
- Fullscreen mode
- Download button
- Print button

#### 9.4 Report Download
**Create Download Component:**
- Download button
- Direct download link
- Open in new tab option
- Progress indicator (for large files)
- Error handling
- Retry option

#### 9.5 Report Status Tracking
**Create Status Tracker:**
- Real-time status updates
- Polling for GENERATING status
- Auto-refresh when status changes
- Show progress (if available)
- Show error message (if FAILED)
- Auto-redirect when COMPLETED

**Status Updates:**
- PENDING → GENERATING (on trigger)
- GENERATING → COMPLETED (when done)
- GENERATING → FAILED (if error)
- Show appropriate UI for each status

#### 9.6 Report Detail Page
**Create Report Detail View:**
- Report Information:
  - Report number
  - Status
  - Generated date
  - Generated by
- Patient Information:
  - Patient details
  - Link to patient profile
- Doctor Information:
  - Doctor name
  - Signed date
- PDF Preview:
  - Embedded PDF viewer
  - Download button
  - Print button
- Related Data:
  - Link to patient results
  - Link to doctor review

#### 9.7 Testing Requirements
- Test report list
- Test report generation
- Test PDF viewing
- Test PDF download
- Test status tracking
- Test error handling
- Test report detail view

### Deliverables
- ✅ Complete report management UI
- ✅ Report generation working
- ✅ PDF viewing functional
- ✅ PDF download working
- ✅ Status tracking functional
- ✅ Responsive design
- ✅ All tests passing

---

## Phase 10: Audit Trail & Security UI

### Objectives
- Create audit log viewing interface
- Implement security settings UI
- Add user activity tracking display
- Create admin security dashboard

### Tasks

#### 10.1 Audit Log List Page
**Create Audit Log Component:**
- Table view of audit logs
- Columns:
  - Timestamp
  - User (name/email)
  - Action
  - Entity Type
  - Entity ID
  - Changes (expandable)
  - IP Address
  - User Agent
- Filters:
  - Filter by user
  - Filter by action
  - Filter by entity type
  - Filter by date range
- Search functionality
- Sort options
- Pagination
- Export to CSV (optional)

**Change Display:**
- Show before/after values
- Highlight changes
- Expandable details
- JSON viewer for complex changes

#### 10.2 Entity Audit Trail
**Create Entity Audit Component:**
- Show all audit logs for specific entity
- Timeline view
- Group by date
- Show user actions
- Show changes made
- Filter by action type

#### 10.3 Security Settings UI
**Create Security Settings Component:**
- Password Policy Display
- Session Management:
  - Active sessions list
  - Revoke session option
- Two-Factor Authentication (future)
- API Key Management (future)
- Security Alerts (optional)

#### 10.4 Testing Requirements
- Test audit log list
- Test filtering and search
- Test entity audit trail
- Test security settings
- Test change display

### Deliverables
- ✅ Complete audit trail UI
- ✅ Security settings UI
- ✅ Entity audit trail working
- ✅ Responsive design
- ✅ All tests passing

---

## UI/UX Requirements

### Design Principles
1. **Consistency**: Uniform design language throughout
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Responsiveness**: Mobile-first approach
4. **Performance**: Fast load times, smooth interactions
5. **Usability**: Intuitive navigation, clear actions
6. **Feedback**: Clear loading states, error messages, success notifications

### Color Scheme
- **Primary**: Professional blue (#1976d2)
- **Success**: Green (#4caf50)
- **Warning**: Orange (#ff9800)
- **Error**: Red (#f44336)
- **Info**: Blue (#2196f3)
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Headings**: Bold, clear hierarchy
- **Body**: Readable font size (14-16px)
- **Labels**: Medium weight
- **Code**: Monospace font

### Components Library
- **Buttons**: Primary, Secondary, Danger, Text variants
- **Inputs**: Text, Number, Email, Password, Select, Date, Textarea
- **Cards**: Elevated, outlined variants
- **Tables**: Sortable, filterable, paginated
- **Modals**: Confirmation, Form, Information
- **Notifications**: Toast notifications, Snackbars
- **Loading**: Spinners, Skeletons, Progress bars
- **Badges**: Status indicators, Count badges

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Navigation Structure
- **Top Navigation**: Logo, User menu, Notifications
- **Side Navigation**: Role-based menu items
- **Breadcrumbs**: For deep navigation
- **Footer**: Links, copyright (optional)

### Loading States
- **Page Load**: Skeleton screens
- **Button Actions**: Spinner in button
- **Form Submission**: Disable form, show spinner
- **Data Fetching**: Loading indicator
- **Long Operations**: Progress bar

### Error Handling
- **Form Errors**: Inline error messages
- **API Errors**: Toast notifications
- **Network Errors**: Retry button
- **404 Errors**: Custom 404 page
- **500 Errors**: Error boundary with message

### Success Feedback
- **Form Submission**: Success toast
- **Actions**: Success message
- **Redirects**: Smooth transitions
- **Updates**: Optimistic updates with rollback

---

## Testing Requirements

### Testing Tools
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: React Testing Library
- **E2E Tests**: Playwright or Cypress
- **Visual Tests**: Storybook (optional)
- **Accessibility Tests**: jest-axe

### Test Coverage Requirements
- **Components**: 80%+ coverage
- **Hooks**: 90%+ coverage
- **Utils**: 90%+ coverage
- **Services**: 80%+ coverage
- **E2E**: Critical user flows

### Test Scenarios

#### Authentication
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Token expiration handling
- ✅ Logout functionality
- ✅ Protected route access

#### User Management
- ✅ User list rendering
- ✅ User creation form
- ✅ User edit form
- ✅ Role-based UI rendering
- ✅ Search and filtering

#### Patient Registration
- ✅ Patient registration form
- ✅ Price calculation
- ✅ Patient list
- ✅ Patient search
- ✅ Payment status update

#### Test Assignment
- ✅ Auto-assignment flow
- ✅ Manual assignment
- ✅ Assignment list
- ✅ Status updates
- ✅ Admin dashboard

#### Test Results
- ✅ Result entry form
- ✅ Dynamic form generation
- ✅ Validation
- ✅ Result viewing
- ✅ Result verification

#### Blood Test
- ✅ Sample registration
- ✅ Passcode access
- ✅ Status updates
- ✅ Result submission

#### Doctor Review
- ✅ Patient results view
- ✅ Review form
- ✅ Passkey setup
- ✅ Report signing

#### Report Generation
- ✅ Report generation
- ✅ PDF viewing
- ✅ PDF download
- ✅ Status tracking

### E2E Test Flows
1. **Complete Patient Journey**:
   - Register patient → Assign tests → Submit results → Doctor review → Generate report

2. **Admin Workflow**:
   - Login → Create user → Create package → Create test → Link test to package

3. **Test Admin Workflow**:
   - Login → View assignments → Update status → Submit results

4. **Lab Tech Workflow**:
   - Login → Access sample → Update status → Submit results

5. **Doctor Workflow**:
   - Login → View patients → Review results → Add remarks → Sign report

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Performance optimization done
- [ ] Accessibility audit done
- [ ] Browser compatibility tested
- [ ] Environment variables configured
- [ ] API endpoints configured
- [ ] Build optimization done

### Build Configuration
- [ ] Production build working
- [ ] Environment variables set
- [ ] API base URL configured
- [ ] Source maps (for debugging)
- [ ] Asset optimization
- [ ] Code splitting configured
- [ ] Lazy loading implemented

### Deployment Steps
1. Build production bundle
2. Test production build locally
3. Deploy to hosting (Vercel, Netlify, AWS, etc.)
4. Configure environment variables
5. Set up custom domain (if needed)
6. Configure SSL certificate
7. Set up CDN (if needed)
8. Test production deployment
9. Set up monitoring
10. Set up error tracking

### Post-Deployment
- [ ] Verify all pages load
- [ ] Test authentication flow
- [ ] Test API integration
- [ ] Check error tracking
- [ ] Monitor performance
- [ ] Set up alerts
- [ ] Document deployment process

### Environment Variables Required
```
# API Configuration
REACT_APP_API_BASE_URL=https://api.example.com
REACT_APP_API_TIMEOUT=30000

# Application
REACT_APP_APP_NAME=LIMS
REACT_APP_ENV=production

# Features
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_ERROR_TRACKING=true

# File Upload
REACT_APP_MAX_FILE_SIZE=5242880

# Pagination
REACT_APP_DEFAULT_PAGE_SIZE=10
REACT_APP_MAX_PAGE_SIZE=100
```

---

## Development Guidelines

### Code Standards
- Follow React best practices
- Use TypeScript strictly
- Write self-documenting code
- Add comments for complex logic
- Follow naming conventions
- Use functional components and hooks

### Component Guidelines
- Keep components small and focused
- Use composition over inheritance
- Extract reusable logic to hooks
- Use proper TypeScript types
- Handle loading and error states
- Make components accessible

### State Management
- Use local state for component-specific data
- Use global state for shared data
- Use React Query for server state
- Avoid prop drilling
- Use context for theme/auth (sparingly)

### API Integration
- Use React Query for data fetching
- Implement proper error handling
- Use optimistic updates where appropriate
- Cache API responses appropriately
- Handle loading states
- Implement retry logic

### Performance Optimization
- Use React.memo for expensive components
- Use useMemo for expensive calculations
- Use useCallback for function props
- Implement code splitting
- Lazy load routes
- Optimize images
- Minimize bundle size

### Accessibility
- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation
- Maintain focus management
- Provide alt text for images
- Ensure color contrast
- Test with screen readers

---

## Success Criteria

### Phase Completion Criteria
Each phase is complete when:
1. ✅ All UI components implemented
2. ✅ All API endpoints integrated
3. ✅ All tests passing (80%+ coverage)
4. ✅ Responsive design working
5. ✅ Error handling implemented
6. ✅ Loading states implemented
7. ✅ Accessibility requirements met
8. ✅ Code reviewed

### MVP Completion Criteria
Frontend MVP is complete when:
1. ✅ All 10 phases completed
2. ✅ All core features working
3. ✅ Responsive on all devices
4. ✅ Performance acceptable (<3s load time)
5. ✅ Zero critical bugs
6. ✅ Production-ready
7. ✅ Accessible (WCAG 2.1 AA)
8. ✅ Ready for user testing

---

## Support & Resources

### React Documentation
- Official docs: https://react.dev
- Next.js docs: https://nextjs.org/docs
- React Query docs: https://tanstack.com/query

### UI Libraries
- Material-UI: https://mui.com
- Ant Design: https://ant.design
- Tailwind CSS: https://tailwindcss.com

### Testing
- React Testing Library: https://testing-library.com/react
- Playwright: https://playwright.dev
- Cypress: https://cypress.io

### Accessibility
- WCAG Guidelines: https://www.w3.org/WAI/WCAG21/quickref
- ARIA: https://www.w3.org/WAI/ARIA

---

*This guide should be your primary reference for frontend development. Follow it phase by phase, ensuring each phase is complete before moving to the next.*

*Last Updated: [Date]*






