# LIMS Backend Development Guide
## Backend-First Approach - MVP Core Features

---

## Table of Contents
1. [Development Approach](#development-approach)
2. [Technology Stack & Setup](#technology-stack--setup)
3. [Database Schema Specifications](#database-schema-specifications)
4. [Phase 1: Foundation & Authentication](#phase-1-foundation--authentication)
5. [Phase 2: User Management & RBAC](#phase-2-user-management--rbac)
6. [Phase 3: Package & Test Management](#phase-3-package--test-management)
7. [Phase 4: Patient Registration](#phase-4-patient-registration)
8. [Phase 5: Test Assignment System](#phase-5-test-assignment-system)
9. [Phase 6: Test Result Entry](#phase-6-test-result-entry)
10. [Phase 7: Blood Test Workflow](#phase-7-blood-test-workflow)
11. [Phase 8: Doctor Review & Signing](#phase-8-doctor-review--signing)
12. [Phase 9: Report Generation](#phase-9-report-generation)
13. [Phase 10: Audit Trail & Security](#phase-10-audit-trail--security)
14. [API Testing Requirements](#api-testing-requirements)
15. [Deployment Checklist](#deployment-checklist)

---

## Development Approach

### Backend-First Strategy
- Build complete backend API with all MVP features
- All endpoints must be fully functional and tested
- Use Postman/Thunder Client for API testing during development
- Document all APIs with Swagger/OpenAPI
- No frontend dependencies - backend should work standalone
- Each phase must be complete and tested before moving to next

### Development Principles
1. **Test-Driven Development**: Write tests for each feature
2. **API-First Design**: Design endpoints before implementation
3. **Error Handling**: Comprehensive error responses
4. **Validation**: Input validation at every layer
5. **Security**: Security considerations from day one
6. **Documentation**: Self-documenting code + API docs

---

## Technology Stack & Setup

### Required Technologies
- **Framework**: NestJS (latest stable version)
- **Database**: PostgreSQL (version 14+)
- **ORM**: TypeORM or Prisma (choose one)
- **Authentication**: JWT (@nestjs/jwt)
- **Validation**: class-validator, class-transformer
- **Password Hashing**: bcrypt
- **Passkey**: WebAuthn library (for doctor signing)
- **File Storage**: Local filesystem (MVP) or AWS S3
- **PDF Generation**: PDFKit or Puppeteer
- **Testing**: Jest
- **API Documentation**: Swagger/OpenAPI

### Project Structure
```
src/
  common/
    decorators/
    guards/
    interceptors/
    filters/
    pipes/
  config/
  modules/
    auth/
    users/
    packages/
    tests/
    patients/
    assignments/
    results/
    blood-samples/
    doctor-reviews/
    reports/
    audit/
  database/
    migrations/
    seeds/
```

---

## Database Schema Specifications

### Core Tables

#### users
- **id**: UUID (Primary Key)
- **email**: VARCHAR(255) UNIQUE NOT NULL
- **password_hash**: VARCHAR(255) NOT NULL
- **full_name**: VARCHAR(255) NOT NULL
- **role**: ENUM('SUPER_ADMIN', 'RECEPTIONIST', 'TEST_ADMIN', 'LAB_TECHNICIAN', 'DOCTOR') NOT NULL
- **test_admin_type**: VARCHAR(100) NULL (for TEST_ADMIN: 'audiometry', 'xray', 'eye_test', 'pft', etc.)
- **is_active**: BOOLEAN DEFAULT true
- **passkey_credential_id**: TEXT NULL (for doctors)
- **passkey_public_key**: TEXT NULL (for doctors)
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: email, role, test_admin_type

#### packages
- **id**: UUID (Primary Key)
- **name**: VARCHAR(255) NOT NULL
- **description**: TEXT NULL
- **price**: DECIMAL(10,2) NOT NULL
- **validity_days**: INTEGER DEFAULT 365
- **is_active**: BOOLEAN DEFAULT true
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: name, is_active

#### tests
- **id**: UUID (Primary Key)
- **name**: VARCHAR(255) NOT NULL
- **description**: TEXT NULL
- **category**: VARCHAR(100) NOT NULL ('on_site', 'lab')
- **admin_role**: VARCHAR(100) NOT NULL (which admin type handles this)
- **normal_range_min**: DECIMAL(10,2) NULL
- **normal_range_max**: DECIMAL(10,2) NULL
- **unit**: VARCHAR(50) NULL
- **test_fields**: JSONB NOT NULL (structure: [{field_name, field_type, required, options}])
- **is_active**: BOOLEAN DEFAULT true
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: category, admin_role, is_active

#### package_tests (Many-to-Many)
- **id**: UUID (Primary Key)
- **package_id**: UUID (Foreign Key → packages.id)
- **test_id**: UUID (Foreign Key → tests.id)
- **test_price**: DECIMAL(10,2) NULL (override package price for this test)
- **created_at**: TIMESTAMP DEFAULT NOW()

**Unique Constraint**: (package_id, test_id)

#### patients
- **id**: UUID (Primary Key)
- **patient_id**: VARCHAR(50) UNIQUE NOT NULL (generated: PAT-YYYYMMDD-XXXX)
- **name**: VARCHAR(255) NOT NULL
- **age**: INTEGER NOT NULL
- **gender**: ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL
- **contact_number**: VARCHAR(20) NOT NULL
- **email**: VARCHAR(255) NULL
- **employee_id**: VARCHAR(100) NULL
- **company_name**: VARCHAR(255) NULL
- **address**: TEXT NULL
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: patient_id, contact_number, employee_id

#### patient_packages
- **id**: UUID (Primary Key)
- **patient_id**: UUID (Foreign Key → patients.id)
- **package_id**: UUID (Foreign Key → packages.id)
- **addon_test_ids**: JSONB DEFAULT '[]' (array of test UUIDs)
- **total_price**: DECIMAL(10,2) NOT NULL
- **payment_status**: ENUM('PENDING', 'PAID', 'PARTIAL') DEFAULT 'PENDING'
- **payment_amount**: DECIMAL(10,2) DEFAULT 0
- **registered_by**: UUID (Foreign Key → users.id)
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: patient_id, package_id, payment_status

#### assignments
- **id**: UUID (Primary Key)
- **patient_id**: UUID (Foreign Key → patients.id)
- **test_id**: UUID (Foreign Key → tests.id)
- **admin_id**: UUID (Foreign Key → users.id) NULL (assigned admin)
- **status**: ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED') DEFAULT 'PENDING'
- **assigned_at**: TIMESTAMP NULL
- **started_at**: TIMESTAMP NULL
- **completed_at**: TIMESTAMP NULL
- **assigned_by**: UUID (Foreign Key → users.id) NULL
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: patient_id, test_id, admin_id, status

#### test_results
- **id**: UUID (Primary Key)
- **assignment_id**: UUID (Foreign Key → assignments.id) UNIQUE
- **patient_id**: UUID (Foreign Key → patients.id)
- **test_id**: UUID (Foreign Key → tests.id)
- **result_values**: JSONB NOT NULL (structure matches test.test_fields)
- **entered_by**: UUID (Foreign Key → users.id)
- **entered_at**: TIMESTAMP DEFAULT NOW()
- **verified_at**: TIMESTAMP NULL
- **is_verified**: BOOLEAN DEFAULT false
- **notes**: TEXT NULL
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: assignment_id, patient_id, test_id, entered_by

#### blood_samples
- **id**: UUID (Primary Key)
- **patient_id**: UUID (Foreign Key → patients.id)
- **sample_id**: VARCHAR(50) UNIQUE NOT NULL (generated: BL-YYYYMMDD-XXXX)
- **passcode_hash**: VARCHAR(255) NOT NULL (6-digit passcode hashed)
- **collected_at**: TIMESTAMP DEFAULT NOW()
- **collected_by**: UUID (Foreign Key → users.id)
- **status**: ENUM('COLLECTED', 'IN_LAB', 'TESTED', 'COMPLETED') DEFAULT 'COLLECTED'
- **tested_at**: TIMESTAMP NULL
- **tested_by**: UUID (Foreign Key → users.id) NULL
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: sample_id, patient_id, status

#### doctor_reviews
- **id**: UUID (Primary Key)
- **patient_id**: UUID (Foreign Key → patients.id)
- **doctor_id**: UUID (Foreign Key → users.id)
- **remarks**: TEXT NULL
- **reviewed_at**: TIMESTAMP NULL
- **signed_at**: TIMESTAMP NULL
- **passkey_verified**: BOOLEAN DEFAULT false
- **is_signed**: BOOLEAN DEFAULT false
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Unique Constraint**: (patient_id, doctor_id)

**Indexes**: patient_id, doctor_id, is_signed

#### reports
- **id**: UUID (Primary Key)
- **patient_id**: UUID (Foreign Key → patients.id)
- **report_number**: VARCHAR(50) UNIQUE NOT NULL (generated: RPT-YYYYMMDD-XXXX)
- **doctor_review_id**: UUID (Foreign Key → doctor_reviews.id) NULL
- **status**: ENUM('PENDING', 'GENERATING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING'
- **pdf_url**: VARCHAR(500) NULL
- **generated_at**: TIMESTAMP NULL
- **generated_by**: UUID (Foreign Key → users.id) NULL
- **created_at**: TIMESTAMP DEFAULT NOW()
- **updated_at**: TIMESTAMP DEFAULT NOW()

**Indexes**: report_number, patient_id, status

#### audit_logs
- **id**: UUID (Primary Key)
- **user_id**: UUID (Foreign Key → users.id) NULL
- **action**: VARCHAR(100) NOT NULL (CREATE, UPDATE, DELETE, VIEW, SIGN, etc.)
- **entity_type**: VARCHAR(100) NOT NULL (PATIENT, TEST_RESULT, REPORT, etc.)
- **entity_id**: UUID NULL
- **changes**: JSONB NULL (before/after values)
- **ip_address**: VARCHAR(45) NULL
- **user_agent**: TEXT NULL
- **timestamp**: TIMESTAMP DEFAULT NOW()

**Indexes**: user_id, action, entity_type, timestamp

---

## Phase 1: Foundation & Authentication

### Objectives
- Set up NestJS project structure
- Configure database connection
- Implement authentication system
- Create user login/logout functionality

### Tasks

#### 1.1 Project Setup
- Initialize NestJS project with TypeScript
- Configure environment variables (.env file)
- Set up database connection (PostgreSQL)
- Configure TypeORM/Prisma
- Set up project folder structure
- Configure ESLint and Prettier
- Set up Swagger/OpenAPI documentation

#### 1.2 Database Setup
- Create database
- Set up migration system
- Create initial migration for users table
- Set up database seeds (optional: create first super admin)

#### 1.3 Authentication Module
**Create Auth Module with:**
- Login endpoint (POST /auth/login)
  - Input: email, password
  - Output: access_token, refresh_token, user details
  - Validate credentials
  - Generate JWT tokens
  - Return user role and basic info
  
- Logout endpoint (POST /auth/logout)
  - Input: refresh_token (optional)
  - Invalidate refresh token (if using token blacklist)
  - Return success message

- Refresh token endpoint (POST /auth/refresh)
  - Input: refresh_token
  - Validate refresh token
  - Generate new access token
  - Return new tokens

- Get current user endpoint (GET /auth/me)
  - Requires authentication
  - Return current user details

#### 1.4 Password Management
- Password hashing service (bcrypt)
- Password validation rules:
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character

#### 1.5 JWT Configuration
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry
- JWT secret from environment variables
- Token payload: userId, email, role

#### 1.6 Guards & Decorators
- Create JWT Auth Guard
- Create Public decorator (for public endpoints)
- Create Roles decorator (for role-based access)
- Create CurrentUser decorator (to get logged-in user)

#### 1.7 Error Handling
- Global exception filter
- Standard error response format:
  ```json
  {
    "statusCode": 400,
    "message": "Error message",
    "error": "Bad Request",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
  ```

#### 1.8 Validation
- Global validation pipe
- DTO classes for all endpoints
- Use class-validator decorators

#### 1.9 Testing Requirements
- Unit tests for auth service
- Integration tests for login/logout endpoints
- Test invalid credentials
- Test token expiration
- Test refresh token flow

### Deliverables
- ✅ Working authentication system
- ✅ JWT token generation and validation
- ✅ Protected routes with guards
- ✅ Swagger documentation for auth endpoints
- ✅ All tests passing

---

## Phase 2: User Management & RBAC

### Objectives
- Implement user CRUD operations
- Set up role-based access control
- Create user management endpoints

### Tasks

#### 2.1 User Module
**Create Users Module with:**

- Create user endpoint (POST /users)
  - **Access**: SUPER_ADMIN only
  - **Input**: email, password, full_name, role, test_admin_type (if role is TEST_ADMIN)
  - **Validation**:
    - Email must be unique
    - Password meets requirements
    - Role must be valid enum value
    - If role is TEST_ADMIN, test_admin_type is required
  - **Process**:
    - Hash password
    - Create user record
    - Log action in audit_logs
  - **Output**: User object (without password)

- Get all users endpoint (GET /users)
  - **Access**: SUPER_ADMIN only
  - **Query params**: 
    - page, limit (pagination)
    - role (filter by role)
    - search (search by name/email)
  - **Output**: Paginated list of users

- Get user by ID endpoint (GET /users/:id)
  - **Access**: SUPER_ADMIN or own profile
  - **Output**: User details

- Update user endpoint (PUT /users/:id)
  - **Access**: SUPER_ADMIN or own profile (limited fields)
  - **Input**: full_name, email, role (SUPER_ADMIN only), test_admin_type, is_active
  - **Validation**: Email uniqueness check
  - **Process**: Update user, log changes
  - **Output**: Updated user

- Delete user endpoint (DELETE /users/:id)
  - **Access**: SUPER_ADMIN only
  - **Validation**: Cannot delete own account
  - **Process**: Soft delete (set is_active = false) or hard delete
  - **Output**: Success message

- Change password endpoint (POST /users/:id/change-password)
  - **Access**: Own profile or SUPER_ADMIN
  - **Input**: current_password, new_password
  - **Validation**: 
    - Verify current password
    - New password meets requirements
  - **Process**: Update password hash, log action
  - **Output**: Success message

#### 2.2 Role-Based Access Control
**Create RBAC Guards:**
- RolesGuard: Check if user has required role
- Use @Roles() decorator on endpoints
- Role hierarchy:
  - SUPER_ADMIN: All access
  - RECEPTIONIST: Patient management, assignments
  - TEST_ADMIN: Own assignments, result entry
  - LAB_TECHNICIAN: Blood sample access, result entry
  - DOCTOR: View all results, review, sign

#### 2.3 User Roles Enum
Define roles:
- SUPER_ADMIN
- RECEPTIONIST
- TEST_ADMIN (with subtypes: audiometry, xray, eye_test, pft, etc.)
- LAB_TECHNICIAN
- DOCTOR

#### 2.4 Test Admin Types
Define test admin types:
- audiometry
- xray
- eye_test
- pft
- ecg
- (add more as needed)

#### 2.5 Testing Requirements
- Test user creation with all roles
- Test role-based access restrictions
- Test user update permissions
- Test password change
- Test user deletion
- Test pagination and filtering

### Deliverables
- ✅ Complete user management API
- ✅ RBAC system working
- ✅ All endpoints protected with proper roles
- ✅ Swagger documentation
- ✅ All tests passing

---

## Phase 3: Package & Test Management

### Objectives
- Create package management system
- Create test management system
- Link tests to packages
- Map tests to admin roles

### Tasks

#### 3.1 Package Module
**Create Packages Module with:**

- Create package endpoint (POST /packages)
  - **Access**: SUPER_ADMIN only
  - **Input**: name, description, price, validity_days
  - **Validation**: 
    - Name required, unique
    - Price must be positive number
    - Validity days must be positive integer
  - **Output**: Created package

- Get all packages endpoint (GET /packages)
  - **Access**: All authenticated users
  - **Query params**: is_active (filter)
  - **Output**: List of packages

- Get package by ID endpoint (GET /packages/:id)
  - **Access**: All authenticated users
  - **Output**: Package with associated tests

- Update package endpoint (PUT /packages/:id)
  - **Access**: SUPER_ADMIN only
  - **Input**: name, description, price, validity_days, is_active
  - **Output**: Updated package

- Delete package endpoint (DELETE /packages/:id)
  - **Access**: SUPER_ADMIN only
  - **Validation**: Check if package is used by any patient
  - **Process**: Soft delete (set is_active = false)
  - **Output**: Success message

- Add test to package endpoint (POST /packages/:id/tests)
  - **Access**: SUPER_ADMIN only
  - **Input**: test_id, test_price (optional override)
  - **Validation**: Test exists, not already in package
  - **Output**: Success message

- Remove test from package endpoint (DELETE /packages/:id/tests/:testId)
  - **Access**: SUPER_ADMIN only
  - **Output**: Success message

- Get package tests endpoint (GET /packages/:id/tests)
  - **Access**: All authenticated users
  - **Output**: List of tests in package

#### 3.2 Test Module
**Create Tests Module with:**

- Create test endpoint (POST /tests)
  - **Access**: SUPER_ADMIN only
  - **Input**: 
    - name, description, category, admin_role
    - normal_range_min, normal_range_max, unit
    - test_fields (JSON array of field definitions)
  - **Test Fields Structure**:
    ```json
    [
      {
        "field_name": "result_value",
        "field_type": "number",
        "required": true,
        "options": null
      },
      {
        "field_name": "notes",
        "field_type": "text",
        "required": false,
        "options": null
      }
    ]
  ```
  - **Validation**: 
    - Name required, unique
    - Category must be 'on_site' or 'lab'
    - Admin role must match test admin types
    - Normal range: min < max if both provided
  - **Output**: Created test

- Get all tests endpoint (GET /tests)
  - **Access**: All authenticated users
  - **Query params**: 
    - category (filter)
    - admin_role (filter)
    - is_active (filter)
  - **Output**: List of tests

- Get test by ID endpoint (GET /tests/:id)
  - **Access**: All authenticated users
  - **Output**: Test details

- Update test endpoint (PUT /tests/:id)
  - **Access**: SUPER_ADMIN only
  - **Input**: Same as create
  - **Validation**: Check if test is used in any package
  - **Output**: Updated test

- Delete test endpoint (DELETE /tests/:id)
  - **Access**: SUPER_ADMIN only
  - **Validation**: Check if test is used in any package or assignment
  - **Process**: Soft delete (set is_active = false)
  - **Output**: Success message

- Get tests by admin role endpoint (GET /tests/by-admin-role/:adminRole)
  - **Access**: All authenticated users
  - **Output**: List of tests for specific admin role

#### 3.3 Test Field Types
Define field types:
- number: Numeric input
- text: Text input
- select: Dropdown (requires options array)
- boolean: Checkbox
- date: Date picker
- file: File upload (for future)

#### 3.4 Testing Requirements
- Test package CRUD operations
- Test test CRUD operations
- Test adding/removing tests from packages
- Test validation rules
- Test soft delete functionality
- Test filtering and search

### Deliverables
- ✅ Complete package management API
- ✅ Complete test management API
- ✅ Package-test relationship working
- ✅ Test-admin role mapping working
- ✅ Swagger documentation
- ✅ All tests passing

---

## Phase 4: Patient Registration

### Objectives
- Implement patient registration system
- Generate unique patient IDs
- Handle package selection and addon services
- Track payment status

### Tasks

#### 4.1 Patient Module
**Create Patients Module with:**

- Register patient endpoint (POST /patients/register)
  - **Access**: RECEPTIONIST, SUPER_ADMIN
  - **Input**: 
    - name, age, gender, contact_number
    - email (optional), employee_id (optional)
    - company_name (optional), address (optional)
    - package_id
    - addon_test_ids (array of test UUIDs)
  - **Validation**:
    - All required fields present
    - Age must be positive integer
    - Gender must be valid enum
    - Contact number format validation
    - Email format validation (if provided)
    - Package exists and is active
    - Addon tests exist and are active
  - **Process**:
    - Generate unique patient_id (PAT-YYYYMMDD-XXXX)
    - Calculate total price (package price + addon test prices)
    - Create patient record
    - Create patient_packages record
    - Log action in audit_logs
  - **Output**: Patient object with patient_id

- Get all patients endpoint (GET /patients)
  - **Access**: RECEPTIONIST, SUPER_ADMIN, DOCTOR
  - **Query params**:
    - page, limit (pagination)
    - search (search by name, patient_id, contact, employee_id)
    - date_from, date_to (filter by registration date)
  - **Output**: Paginated list of patients

- Get patient by ID endpoint (GET /patients/:id)
  - **Access**: All authenticated users (with restrictions)
  - **Output**: Patient details with package info

- Get patient by patient_id endpoint (GET /patients/by-patient-id/:patientId)
  - **Access**: All authenticated users
  - **Output**: Patient details

- Update patient endpoint (PUT /patients/:id)
  - **Access**: RECEPTIONIST, SUPER_ADMIN
  - **Input**: name, age, gender, contact_number, email, etc.
  - **Validation**: Same as registration
  - **Process**: Update patient, log changes
  - **Output**: Updated patient

- Update payment status endpoint (PUT /patients/:id/payment)
  - **Access**: RECEPTIONIST, SUPER_ADMIN
  - **Input**: payment_status, payment_amount
  - **Validation**: 
    - Payment amount <= total price
    - Payment status valid enum
  - **Process**: Update payment, log action
  - **Output**: Updated payment info

#### 4.2 Patient ID Generation
**Algorithm:**
- Format: PAT-YYYYMMDD-XXXX
- YYYYMMDD: Registration date
- XXXX: 4-digit sequential number (reset daily)
- Check uniqueness before saving
- If conflict, increment sequence

#### 4.3 Price Calculation
**Logic:**
- Package base price
- Add individual test prices from addon_test_ids
- Store total_price in patient_packages
- Allow payment tracking (PENDING, PAID, PARTIAL)

#### 4.4 Testing Requirements
- Test patient registration with all fields
- Test patient ID generation uniqueness
- Test price calculation
- Test payment status update
- Test search functionality
- Test pagination
- Test validation rules

### Deliverables
- ✅ Complete patient registration API
- ✅ Unique patient ID generation
- ✅ Package and addon selection working
- ✅ Payment tracking functional
- ✅ Swagger documentation
- ✅ All tests passing

---

## Phase 5: Test Assignment System

### Objectives
- Automatically assign tests to admins based on package
- Allow manual assignment/reassignment
- Track assignment status
- Provide admin dashboard data

### Tasks

#### 5.1 Assignment Module
**Create Assignments Module with:**

- Auto-assign tests endpoint (POST /assignments/auto-assign/:patientId)
  - **Access**: RECEPTIONIST, SUPER_ADMIN
  - **Process**:
    - Get patient's package and addon tests
    - For each test:
      - Find available admin with matching test_admin_type
      - Create assignment record
      - Set status to 'ASSIGNED'
      - Set assigned_at timestamp
    - Handle case where no admin available (set status to 'PENDING')
  - **Output**: List of created assignments

- Manual assign endpoint (POST /assignments/manual-assign)
  - **Access**: RECEPTIONIST, SUPER_ADMIN
  - **Input**: patient_id, test_id, admin_id
  - **Validation**:
    - Patient exists
    - Test exists and is in patient's package/addons
    - Admin exists and has matching test_admin_type
  - **Process**: Create or update assignment
  - **Output**: Assignment object

- Reassign endpoint (PUT /assignments/:id/reassign)
  - **Access**: RECEPTIONIST, SUPER_ADMIN
  - **Input**: admin_id
  - **Validation**: Admin has correct test_admin_type
  - **Process**: Update assignment, log change
  - **Output**: Updated assignment

- Get assignments by patient endpoint (GET /assignments/patient/:patientId)
  - **Access**: All authenticated users
  - **Output**: List of all assignments for patient

- Get my assignments endpoint (GET /assignments/my-assignments)
  - **Access**: TEST_ADMIN, LAB_TECHNICIAN
  - **Query params**: status (filter)
  - **Output**: List of assignments for current user

- Update assignment status endpoint (PUT /assignments/:id/status)
  - **Access**: TEST_ADMIN, LAB_TECHNICIAN (for own assignments)
  - **Input**: status
  - **Valid transitions**:
    - ASSIGNED → IN_PROGRESS (when admin starts)
    - IN_PROGRESS → COMPLETED (when admin finishes)
    - COMPLETED → SUBMITTED (when result submitted)
  - **Process**: Update status and timestamps
  - **Output**: Updated assignment

- Get assignment by ID endpoint (GET /assignments/:id)
  - **Access**: All authenticated users
  - **Output**: Assignment details

#### 5.2 Admin Selection Logic
**Algorithm for finding available admin:**
1. Get all active users with role TEST_ADMIN
2. Filter by test_admin_type matching test's admin_role
3. Count current assignments (status != SUBMITTED)
4. Select admin with least assignments
5. If tie, select randomly or by creation date

#### 5.3 Assignment Status Flow
```
PENDING → ASSIGNED → IN_PROGRESS → COMPLETED → SUBMITTED
```

#### 5.4 Testing Requirements
- Test auto-assignment with package tests
- Test manual assignment
- Test reassignment
- Test status transitions
- Test admin selection algorithm
- Test assignment retrieval by patient and admin

### Deliverables
- ✅ Automatic test assignment working
- ✅ Manual assignment working
- ✅ Assignment status tracking functional
- ✅ Admin dashboard data available
- ✅ Swagger documentation
- ✅ All tests passing

---

## Phase 6: Test Result Entry

### Objectives
- Allow admins to enter test results
- Validate result values against test field definitions
- Store results securely
- Make results immutable after submission

### Tasks

#### 6.1 Result Module
**Create Results Module with:**

- Submit test result endpoint (POST /results/submit)
  - **Access**: TEST_ADMIN, LAB_TECHNICIAN
  - **Input**: 
    - assignment_id
    - result_values (JSON object matching test.test_fields)
    - notes (optional)
  - **Validation**:
    - Assignment exists and belongs to current user
    - Assignment status is COMPLETED
    - Result values match test field definitions
    - Required fields present
    - Field types match (number, text, etc.)
    - Values within normal range (if applicable)
  - **Process**:
    - Create test_results record
    - Update assignment status to SUBMITTED
    - Set entered_at timestamp
    - Log action in audit_logs
  - **Output**: Created result

- Get result by assignment endpoint (GET /results/assignment/:assignmentId)
  - **Access**: All authenticated users
  - **Output**: Result details

- Get results by patient endpoint (GET /results/patient/:patientId)
  - **Access**: All authenticated users
  - **Output**: List of all results for patient

- Update result endpoint (PUT /results/:id)
  - **Access**: SUPER_ADMIN only (for corrections)
  - **Input**: result_values, notes
  - **Validation**: Same as submit
  - **Process**: 
    - Update result
    - Log changes in audit_logs (before/after)
    - Set verified_at timestamp
  - **Output**: Updated result

- Verify result endpoint (POST /results/:id/verify)
  - **Access**: SUPER_ADMIN
  - **Process**: Set is_verified = true, verified_at = now
  - **Output**: Verified result

#### 6.2 Result Validation Logic
**For each field in test.test_fields:**
- Check if field exists in result_values
- If required and missing → error
- Validate type:
  - number: Must be numeric
  - text: Must be string
  - select: Must be one of options
  - boolean: Must be boolean
- If normal_range_min/max defined:
  - Check if value is within range
  - Return warning if outside range (but allow submission)

#### 6.3 Result Immutability
- Once submitted, result cannot be modified by admin
- Only SUPER_ADMIN can modify (with audit trail)
- Track all changes in audit_logs

#### 6.4 Testing Requirements
- Test result submission with valid data
- Test validation for all field types
- Test normal range validation
- Test immutability after submission
- Test admin-only update functionality
- Test result retrieval

### Deliverables
- ✅ Test result entry API working
- ✅ Result validation functional
- ✅ Immutability enforced
- ✅ Audit trail for changes
- ✅ Swagger documentation
- ✅ All tests passing

---

## Phase 7: Blood Test Workflow

### Objectives
- Register blood samples with passcode
- Secure access with passcode verification
- Allow lab technician to enter results
- Track sample status

### Tasks

#### 7.1 Blood Sample Module
**Create Blood Samples Module with:**

- Register blood sample endpoint (POST /blood-samples/register)
  - **Access**: RECEPTIONIST, SUPER_ADMIN
  - **Input**: patient_id
  - **Process**:
    - Generate unique sample_id (BL-YYYYMMDD-XXXX)
    - Generate 6-digit passcode (random)
    - Hash passcode (bcrypt)
    - Create blood_samples record
    - Create assignment for blood test
    - Log action
  - **Output**: sample_id, passcode (plain text - only shown once)

- Access sample with passcode endpoint (POST /blood-samples/access)
  - **Access**: LAB_TECHNICIAN
  - **Input**: sample_id, passcode
  - **Validation**:
    - Sample exists
    - Passcode matches
    - Sample status is COLLECTED or IN_LAB
  - **Process**: 
    - Update status to IN_LAB
    - Return sample details and patient info
    - Log access
  - **Output**: Sample and patient details

- Update sample status endpoint (PUT /blood-samples/:id/status)
  - **Access**: LAB_TECHNICIAN
  - **Input**: status
  - **Process**: Update status, log change
  - **Output**: Updated sample

- Get sample by ID endpoint (GET /blood-samples/:id)
  - **Access**: LAB_TECHNICIAN (if accessed with passcode), SUPER_ADMIN
  - **Output**: Sample details

- Get my samples endpoint (GET /blood-samples/my-samples)
  - **Access**: LAB_TECHNICIAN
  - **Query params**: status (filter)
  - **Output**: List of samples accessed by current user

- Submit blood test result endpoint (POST /blood-samples/:id/results)
  - **Access**: LAB_TECHNICIAN
  - **Input**: result_values, notes
  - **Validation**: Same as regular test result
  - **Process**:
    - Create test_results record
    - Update sample status to TESTED
    - Update assignment status to SUBMITTED
    - Log action
  - **Output**: Created result

#### 7.2 Passcode Generation
**Algorithm:**
- Generate random 6-digit number (100000-999999)
- Hash with bcrypt
- Store hash in database
- Return plain passcode only once during registration
- Passcode cannot be retrieved later

#### 7.3 Sample ID Generation
**Algorithm:**
- Format: BL-YYYYMMDD-XXXX
- YYYYMMDD: Collection date
- XXXX: 4-digit sequential number (reset daily)
- Check uniqueness

#### 7.4 Sample Status Flow
```
COLLECTED → IN_LAB → TESTED → COMPLETED
```

#### 7.5 Testing Requirements
- Test sample registration and passcode generation
- Test passcode verification
- Test sample status updates
- Test result submission
- Test passcode security (cannot retrieve)
- Test sample ID uniqueness

### Deliverables
- ✅ Blood sample registration working
- ✅ Passcode system secure
- ✅ Lab technician workflow functional
- ✅ Sample tracking working
- ✅ Swagger documentation
- ✅ All tests passing

---

## Phase 8: Doctor Review & Signing

### Objectives
- Allow doctors to view all test results
- Enable doctors to add remarks
- Implement passkey-based signing
- Track review and signing status

### Tasks

#### 8.1 Doctor Review Module
**Create Doctor Reviews Module with:**

- Get patients for review endpoint (GET /doctor/patients)
  - **Access**: DOCTOR
  - **Query params**: 
    - status (PENDING, REVIEWED, SIGNED)
    - search (patient name/ID)
  - **Process**: 
    - Find patients where all tests are SUBMITTED
    - Exclude already signed patients
  - **Output**: List of patients ready for review

- Get patient results endpoint (GET /doctor/patient/:patientId/results)
  - **Access**: DOCTOR
  - **Output**: 
    - Patient details
    - All test results
    - Assignment statuses
    - Blood sample info (if applicable)

- Create/update review endpoint (POST /doctor/review)
  - **Access**: DOCTOR
  - **Input**: patient_id, remarks
  - **Process**:
    - Check all tests are SUBMITTED
    - Create or update doctor_reviews record
    - Set reviewed_at timestamp
    - Log action
  - **Output**: Review object

- Sign report endpoint (POST /doctor/sign-report)
  - **Access**: DOCTOR
  - **Input**: patient_id, passkey_credential (WebAuthn)
  - **Validation**:
    - All tests SUBMITTED
    - Review exists
    - Passkey verification successful
  - **Process**:
    - Verify passkey using WebAuthn
    - Update doctor_reviews: is_signed = true, signed_at = now
    - Log signing action
    - Trigger report generation (async)
  - **Output**: Signed review object

- Get signed reports endpoint (GET /doctor/signed-reports)
  - **Access**: DOCTOR
  - **Query params**: page, limit, date_from, date_to
  - **Output**: List of signed reports

#### 8.2 Passkey Setup (WebAuthn)
**Create Passkey Module:**

- Setup passkey endpoint (POST /auth/setup-passkey)
  - **Access**: DOCTOR
  - **Process**:
    - Generate WebAuthn challenge
    - Return challenge and options
  - **Output**: Challenge and options

- Verify passkey setup endpoint (POST /auth/verify-passkey-setup)
  - **Access**: DOCTOR
  - **Input**: credential (from WebAuthn)
  - **Process**:
    - Verify credential
    - Store credential_id and public_key in user record
  - **Output**: Success message

- Verify passkey for signing endpoint (POST /auth/verify-passkey)
  - **Access**: DOCTOR
  - **Input**: credential_id, signature, challenge
  - **Process**:
    - Retrieve user's public_key
    - Verify signature
    - Return verification result
  - **Output**: Verification result

#### 8.3 Report Readiness Check
**Logic:**
- All assignments for patient have status SUBMITTED
- All test_results exist
- Blood test (if applicable) is COMPLETED
- Doctor review exists
- Doctor has signed

#### 8.4 Testing Requirements
- Test patient retrieval for review
- Test result viewing
- Test review creation/update
- Test passkey setup and verification
- Test report signing
- Test report readiness check

### Deliverables
- ✅ Doctor review API working
- ✅ Passkey authentication functional
- ✅ Report signing working
- ✅ Report readiness detection
- ✅ Swagger documentation
- ✅ All tests passing

---

## Phase 9: Report Generation

### Objectives
- Automatically generate reports when all conditions met
- Create PDF reports with all test results
- Include doctor remarks and signature
- Store reports securely

### Tasks

#### 9.1 Report Module
**Create Reports Module with:**

- Generate report endpoint (POST /reports/generate/:patientId)
  - **Access**: RECEPTIONIST, SUPER_ADMIN, DOCTOR
  - **Validation**: 
    - All tests SUBMITTED
    - Doctor review exists and is signed
  - **Process**:
    - Create reports record (status: GENERATING)
    - Generate report_number (RPT-YYYYMMDD-XXXX)
    - Collect all data:
      - Patient information
      - Package details
      - All test results with values
      - Normal ranges comparison
      - Doctor remarks
      - Doctor signature info
    - Generate PDF
    - Upload PDF to storage
    - Update reports record (status: COMPLETED, pdf_url)
    - Log action
  - **Output**: Report object

- Auto-generate report (Background job/event listener)
  - **Trigger**: When doctor signs report
  - **Process**: Same as manual generation
  - **Error handling**: Set status to FAILED if error

- Get report by patient endpoint (GET /reports/patient/:patientId)
  - **Access**: All authenticated users
  - **Output**: Report details

- Get report by ID endpoint (GET /reports/:id)
  - **Access**: All authenticated users
  - **Output**: Report details

- Download report endpoint (GET /reports/:id/download)
  - **Access**: All authenticated users
  - **Process**: Return PDF file
  - **Output**: PDF file stream

- Get all reports endpoint (GET /reports)
  - **Access**: RECEPTIONIST, SUPER_ADMIN, DOCTOR
  - **Query params**: 
    - page, limit
    - status (filter)
    - date_from, date_to
    - patient_id
  - **Output**: Paginated list of reports

#### 9.2 Report Number Generation
**Algorithm:**
- Format: RPT-YYYYMMDD-XXXX
- YYYYMMDD: Generation date
- XXXX: 4-digit sequential number (reset daily)
- Check uniqueness

#### 9.3 PDF Report Template
**Sections:**
1. **Header**: 
   - Diagnostic center name/logo
   - Report number
   - Date generated

2. **Patient Information**:
   - Name, age, gender
   - Contact, employee ID, company
   - Patient ID

3. **Package Information**:
   - Package name
   - Validity period

4. **Test Results**:
   - Test name
   - Result values
   - Normal range
   - Status (Normal/Abnormal)
   - Notes (if any)

5. **Doctor Remarks**:
   - Clinical observations
   - Recommendations

6. **Footer**:
   - Doctor name and signature
   - Signature date
   - Digital signature indicator

#### 9.4 PDF Generation Library
- Use PDFKit or Puppeteer
- Create reusable template
- Handle special characters
- Support multiple pages if needed

#### 9.5 File Storage
**MVP**: Local filesystem
- Store in: /uploads/reports/
- Filename: {report_number}.pdf
- Return URL: /api/reports/{id}/download

**Future**: AWS S3 or Cloudinary

#### 9.6 Testing Requirements
- Test report generation with all data
- Test PDF creation
- Test file storage and retrieval
- Test report number uniqueness
- Test auto-generation trigger
- Test error handling

### Deliverables
- ✅ Report generation API working
- ✅ PDF generation functional
- ✅ File storage working
- ✅ Auto-generation on doctor sign
- ✅ Report download working
- ✅ Swagger documentation
- ✅ All tests passing

---

## Phase 10: Audit Trail & Security

### Objectives
- Implement comprehensive audit logging
- Add security enhancements
- Implement data integrity checks
- Add monitoring and alerts

### Tasks

#### 10.1 Audit Module
**Create Audit Module with:**

- Log action interceptor (automatic)
  - **Triggers**: All POST, PUT, DELETE endpoints
  - **Captures**:
    - User ID
    - Action type
    - Entity type and ID
    - Before/after values (for updates)
    - IP address
    - User agent
    - Timestamp

- Get audit logs endpoint (GET /audit-logs)
  - **Access**: SUPER_ADMIN only
  - **Query params**:
    - user_id (filter)
    - action (filter)
    - entity_type (filter)
    - date_from, date_to
    - page, limit
  - **Output**: Paginated audit logs

- Get audit logs for entity endpoint (GET /audit-logs/entity/:entityType/:entityId)
  - **Access**: SUPER_ADMIN only
  - **Output**: All logs for specific entity

#### 10.2 Security Enhancements

- **Rate Limiting**:
  - Implement @nestjs/throttler
  - Limit: 100 requests per minute per IP
  - Stricter limits for auth endpoints (5 per minute)

- **CORS Configuration**:
  - Allow only frontend domain
  - Configure credentials

- **Helmet**:
  - Add security headers
  - Prevent XSS, clickjacking, etc.

- **Input Sanitization**:
  - Sanitize all string inputs
  - Prevent SQL injection (ORM handles this)
  - Prevent XSS attacks

- **Password Policy**:
  - Enforce strong passwords
  - Password history (prevent reuse)
  - Account lockout after failed attempts

- **Session Management**:
  - Token blacklist for logout
  - Token rotation on refresh
  - Secure token storage

#### 10.3 Data Integrity

- **Database Constraints**:
  - Foreign keys with CASCADE rules
  - Unique constraints
  - Check constraints for enums
  - Not null constraints

- **Transaction Management**:
  - Use transactions for multi-step operations
  - Rollback on errors
  - Ensure data consistency

- **Data Validation**:
  - Validate at DTO level
  - Validate at service level
  - Validate at database level

- **Backup Strategy**:
  - Daily automated backups
  - Transaction log backups
  - Backup retention policy

#### 10.4 Monitoring & Alerts

- **Health Check Endpoint** (GET /health)
  - Database connection status
  - System uptime
  - Memory usage
  - Disk space

- **Error Tracking**:
  - Log all errors
  - Alert on critical errors
  - Error aggregation

- **Performance Monitoring**:
  - Log slow queries (>1 second)
  - Monitor API response times
  - Track database query performance

#### 10.5 Testing Requirements
- Test audit logging for all actions
- Test rate limiting
- Test security headers
- Test input sanitization
- Test data integrity constraints
- Test transaction rollback
- Test health check endpoint

### Deliverables
- ✅ Complete audit trail system
- ✅ Security enhancements implemented
- ✅ Data integrity checks working
- ✅ Monitoring endpoints functional
- ✅ Swagger documentation
- ✅ All tests passing

---

## API Testing Requirements

### Testing Tools
- Postman/Thunder Client for manual testing
- Jest for automated testing
- Supertest for API integration tests

### Test Coverage Requirements
- **Unit Tests**: 
  - All services: 80%+ coverage
  - All utilities: 90%+ coverage
  
- **Integration Tests**:
  - All API endpoints
  - Authentication flows
  - Complete workflows (registration → assignment → result → report)

- **E2E Tests**:
  - Complete patient journey
  - Complete doctor review flow
  - Error scenarios

### Test Scenarios

#### Authentication
- ✅ Login with valid credentials
- ✅ Login with invalid credentials
- ✅ Token expiration
- ✅ Refresh token flow
- ✅ Logout

#### User Management
- ✅ Create user with all roles
- ✅ Update user
- ✅ Delete user
- ✅ Role-based access restrictions
- ✅ Password change

#### Patient Registration
- ✅ Register patient with package
- ✅ Register with addon tests
- ✅ Patient ID uniqueness
- ✅ Price calculation
- ✅ Payment status update

#### Test Assignment
- ✅ Auto-assignment
- ✅ Manual assignment
- ✅ Reassignment
- ✅ Status transitions

#### Test Results
- ✅ Submit result
- ✅ Validation errors
- ✅ Normal range warnings
- ✅ Result immutability

#### Blood Test
- ✅ Sample registration
- ✅ Passcode access
- ✅ Result submission

#### Doctor Review
- ✅ View patient results
- ✅ Add remarks
- ✅ Passkey signing

#### Report Generation
- ✅ Manual generation
- ✅ Auto-generation
- ✅ PDF download

### Test Data Setup
- Create seed data for testing
- Use factories for test data generation
- Clean up after tests

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit done
- [ ] Performance testing done
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Backup strategy in place

### Deployment Steps
1. Set up production database
2. Run migrations
3. Seed initial data (super admin)
4. Configure environment variables
5. Build application
6. Deploy to server
7. Set up reverse proxy (Nginx)
8. Configure SSL certificate
9. Set up monitoring
10. Test production endpoints

### Post-Deployment
- [ ] Verify all endpoints working
- [ ] Check health endpoint
- [ ] Monitor error logs
- [ ] Set up alerts
- [ ] Document deployment process

### Environment Variables Required
```
# Database
DATABASE_HOST=
DATABASE_PORT=
DATABASE_USERNAME=
DATABASE_PASSWORD=
DATABASE_NAME=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=

# Application
PORT=
NODE_ENV=production
FRONTEND_URL=

# File Storage
UPLOAD_PATH=/uploads/reports

# Security
BCRYPT_ROUNDS=10
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

---

## Development Guidelines

### Code Standards
- Follow NestJS best practices
- Use TypeScript strictly
- Write self-documenting code
- Add comments for complex logic
- Follow naming conventions

### Git Workflow
- Create feature branches
- Write descriptive commit messages
- Create pull requests for review
- Merge to main after approval

### Documentation
- Document all API endpoints in Swagger
- Write README for each module
- Document complex algorithms
- Keep this guide updated

### Error Handling
- Use custom exception classes
- Return consistent error format
- Log all errors
- Don't expose sensitive information

### Performance
- Optimize database queries
- Use indexes appropriately
- Implement pagination
- Cache frequently accessed data

---

## Success Criteria

### Phase Completion Criteria
Each phase is complete when:
1. ✅ All endpoints implemented and working
2. ✅ All tests passing (80%+ coverage)
3. ✅ Swagger documentation complete
4. ✅ Error handling implemented
5. ✅ Validation working
6. ✅ Audit logging functional
7. ✅ Code reviewed
8. ✅ Documentation updated

### MVP Completion Criteria
Backend MVP is complete when:
1. ✅ All 10 phases completed
2. ✅ All core features working
3. ✅ Security measures in place
4. ✅ Performance acceptable (<500ms response time)
5. ✅ Zero critical bugs
6. ✅ Production-ready
7. ✅ Can be tested with Postman/Thunder Client
8. ✅ Ready for frontend integration

---

## Support & Resources

### NestJS Documentation
- Official docs: https://docs.nestjs.com
- TypeORM docs: https://typeorm.io
- Swagger docs: https://docs.nestjs.com/openapi/introduction

### Database Design
- PostgreSQL docs: https://www.postgresql.org/docs/
- Database design best practices

### Security
- OWASP Top 10
- JWT best practices
- WebAuthn specification

---

*This guide should be your primary reference for backend development. Follow it phase by phase, ensuring each phase is complete before moving to the next.*

*Last Updated: [Date]*

