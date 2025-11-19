<!-- 4e36bc1b-a8c4-4725-bc2a-b4cb88de0646 0358595e-b483-443b-bddf-092cdea924ba -->
# Phase 7: Blood Test Workflow Implementation Plan

## Overview

Create a complete Blood Samples Module that allows RECEPTIONIST users to register blood samples with secure passcodes, enables LAB_TECHNICIAN users to access samples via passcode verification, and provides a workflow for submitting blood test results with proper status tracking.

## Implementation Steps

### 1. Database Schema

- **Create BloodSampleStatus enum** (`lims-backend/src/modules/blood-samples/constants/blood-sample-status.enum.ts`)
- Values: COLLECTED, IN_LAB, TESTED, COMPLETED

- **Create BloodSample entity** (`lims-backend/src/modules/blood-samples/entities/blood-sample.entity.ts`)
- Fields: id (UUID), patientId (UUID, FK to patients), sampleId (VARCHAR(50), unique), passcodeHash (VARCHAR(255)), collectedAt (timestamp), collectedBy (UUID, FK to users), status (enum), testedAt (timestamp, nullable), testedBy (UUID, nullable, FK to users), assignmentId (UUID, nullable, FK to assignments), createdAt, updatedAt
- Relationships: ManyToOne to Patient, User (collectedBy), User (testedBy), Assignment
- Indexes: sampleId (unique), patientId, status

- **Create migration** (`lims-backend/src/database/migrations/1700000009000-CreateBloodSamplesTable.ts`)
- Create blood_samples table with all fields
- Foreign keys to patients, users (collected_by, tested_by), assignments
- Unique constraint on sample_id
- Indexes for performance

### 2. DTOs

- **RegisterBloodSampleDto** (`lims-backend/src/modules/blood-samples/dto/register-blood-sample.dto.ts`)
- patientId (UUID, required)

- **AccessBloodSampleDto** (`lims-backend/src/modules/blood-samples/dto/access-blood-sample.dto.ts`)
- sampleId (string, required)
- passcode (string, required, 6 digits)

- **UpdateBloodSampleStatusDto** (`lims-backend/src/modules/blood-samples/dto/update-blood-sample-status.dto.ts`)
- status (BloodSampleStatus enum, required)

- **SubmitBloodTestResultDto** (`lims-backend/src/modules/blood-samples/dto/submit-blood-test-result.dto.ts`)
- resultValues (Record<string, any>, required)
- notes (string, optional)

- **BloodSampleResponseDto** (`lims-backend/src/modules/blood-samples/dto/blood-sample-response.dto.ts`)
- All sample fields plus nested patient, collectedBy, testedBy, assignment info
- Note: passcodeHash should NEVER be included in response

- **QueryBloodSamplesDto** (`lims-backend/src/modules/blood-samples/dto/query-blood-samples.dto.ts`)
- status (BloodSampleStatus enum, optional) - for filtering

### 3. Services

- **SampleIdService** (`lims-backend/src/modules/blood-samples/services/sample-id.service.ts`)
- `generateSampleId(): Promise<string>`
- Format: BL-YYYYMMDD-XXXX
- 4-digit sequential number reset daily
- Check uniqueness

- **PasscodeService** (`lims-backend/src/modules/blood-samples/services/passcode.service.ts`)
- `generatePasscode(): string` - Generate random 6-digit number (100000-999999)
- `hashPasscode(passcode: string): Promise<string>` - Hash with bcrypt
- `verifyPasscode(passcode: string, hash: string): Promise<boolean>` - Verify passcode

- **BloodSamplesService** (`lims-backend/src/modules/blood-samples/blood-samples.service.ts`)
- `register(dto: RegisterBloodSampleDto, userId: string): Promise<{ sampleId: string, passcode: string }>`
  - Generate sample ID
  - Generate and hash passcode
  - Create blood_sample record
  - Find blood test for patient (category='lab')
  - Create assignment for blood test
  - Log action
  - Return sampleId and plain passcode (only time it's shown)

- `access(dto: AccessBloodSampleDto, userId: string): Promise<BloodSampleResponseDto>`
  - Find sample by sampleId
  - Verify passcode
  - Validate status is COLLECTED or IN_LAB
  - Update status to IN_LAB if COLLECTED
  - Track that user accessed this sample (for "my samples" query)
  - Log access
  - Return sample with patient info

- `updateStatus(id: string, dto: UpdateBloodSampleStatusDto, userId: string): Promise<BloodSampleResponseDto>`
  - Validate user has accessed this sample (or is SUPER_ADMIN)
  - Update status
  - Update testedAt/testedBy if status is TESTED
  - Log change

- `findById(id: string, userId: string): Promise<BloodSampleResponseDto>`
  - Check access: LAB_TECHNICIAN must have accessed sample, SUPER_ADMIN can access any
  - Return sample details

- `findMySamples(userId: string, status?: BloodSampleStatus): Promise<BloodSampleResponseDto[]>`
  - Get all samples accessed by current user
  - Filter by status if provided

- `submitResult(id: string, dto: SubmitBloodTestResultDto, userId: string): Promise<ResultResponseDto>`
  - Get sample with assignment
  - Validate user has accessed sample
  - Validate sample status is IN_LAB or TESTED
  - Get test from assignment
  - Validate result values using ResultValidationService
  - Create test_result record (reuse ResultsService logic)
  - Update sample status to TESTED
  - Update assignment status to SUBMITTED
  - Set testedAt and testedBy
  - Log action
  - Return created result

### 4. Controller

- **BloodSamplesController** (`lims-backend/src/modules/blood-samples/blood-samples.controller.ts`)
- `POST /blood-samples/register` - @Roles(RECEPTIONIST, SUPER_ADMIN)
- `POST /blood-samples/access` - @Roles(LAB_TECHNICIAN)
- `PUT /blood-samples/:id/status` - @Roles(LAB_TECHNICIAN)
- `GET /blood-samples/:id` - @Roles(LAB_TECHNICIAN, SUPER_ADMIN)
- `GET /blood-samples/my-samples` - @Roles(LAB_TECHNICIAN)
- `POST /blood-samples/:id/results` - @Roles(LAB_TECHNICIAN)
- Add Swagger documentation for all endpoints

### 5. Module Setup

- **BloodSamplesModule** (`lims-backend/src/modules/blood-samples/blood-samples.module.ts`)
- Register BloodSample entity
- Register BloodSamplesService, SampleIdService, PasscodeService
- Register BloodSamplesController
- Import AuditModule, AssignmentsModule, ResultsModule, PatientsModule

- **Update AppModule** (`lims-backend/src/app.module.ts`)
- Import BloodSamplesModule

### 6. Access Tracking

- **Create BloodSampleAccess entity** (`lims-backend/src/modules/blood-samples/entities/blood-sample-access.entity.ts`)
- Fields: id (UUID), sampleId (UUID, FK to blood_samples), accessedBy (UUID, FK to users), accessedAt (timestamp)
- Purpose: Track which lab technicians have accessed which samples
- Used for "my samples" query and access validation

- **Create migration** (`lims-backend/src/database/migrations/1700000010000-CreateBloodSampleAccessTable.ts`)
- Create blood_sample_access table
- Foreign keys and indexes

### 7. Testing

- **Unit Tests**
- `sample-id.service.spec.ts` - Test sample ID generation and uniqueness
- `passcode.service.spec.ts` - Test passcode generation, hashing, verification
- `blood-samples.service.spec.ts` - Test all service methods
- `blood-samples.controller.spec.ts` - Test all endpoints and RBAC

- **E2E Tests**
- `blood-samples.e2e-spec.ts` - Test complete workflows:
  - Register sample and get passcode
  - Access sample with passcode
  - Access sample with wrong passcode (should fail)
  - Update sample status
  - Submit blood test result
  - Get my samples
  - Verify passcode cannot be retrieved after registration

## Key Implementation Details

### Passcode Security

- Passcode generated as random 6-digit number (100000-999999)
- Hashed with bcrypt before storage
- Plain passcode returned ONLY during registration
- Cannot be retrieved later (not stored in plain text)
- Verification uses bcrypt.compare()

### Sample ID Format

- Format: BL-YYYYMMDD-XXXX
- YYYYMMDD: Collection date (today's date)
- XXXX: 4-digit sequential number (0001-9999)
- Resets daily
- Must be unique

### Status Flow

- COLLECTED → IN_LAB → TESTED → COMPLETED
- Status transitions validated
- Cannot go backwards

### Integration with Existing Systems

- Reuses ResultValidationService for result validation
- Creates assignment automatically when sample registered
- Uses ResultsService logic for creating test results
- Integrates with AuditService for logging

### Access Control

- LAB_TECHNICIAN can only access samples they've accessed with passcode
- SUPER_ADMIN can access any sample
- Access tracked in blood_sample_access table

## Files to Create/Modify

**New Files:**

- `lims-backend/src/modules/blood-samples/constants/blood-sample-status.enum.ts`
- `lims-backend/src/modules/blood-samples/entities/blood-sample.entity.ts`
- `lims-backend/src/modules/blood-samples/entities/blood-sample-access.entity.ts`
- `lims-backend/src/modules/blood-samples/dto/register-blood-sample.dto.ts`
- `lims-backend/src/modules/blood-samples/dto/access-blood-sample.dto.ts`
- `lims-backend/src/modules/blood-samples/dto/update-blood-sample-status.dto.ts`
- `lims-backend/src/modules/blood-samples/dto/submit-blood-test-result.dto.ts`
- `lims-backend/src/modules/blood-samples/dto/blood-sample-response.dto.ts`
- `lims-backend/src/modules/blood-samples/dto/query-blood-samples.dto.ts`
- `lims-backend/src/modules/blood-samples/services/sample-id.service.ts`
- `lims-backend/src/modules/blood-samples/services/passcode.service.ts`
- `lims-backend/src/modules/blood-samples/blood-samples.service.ts`
- `lims-backend/src/modules/blood-samples/blood-samples.controller.ts`
- `lims-backend/src/modules/blood-samples/blood-samples.module.ts`
- `lims-backend/src/database/migrations/1700000009000-CreateBloodSamplesTable.ts`
- `lims-backend/src/database/migrations/1700000010000-CreateBloodSampleAccessTable.ts`
- `lims-backend/src/modules/blood-samples/services/sample-id.service.spec.ts`
- `lims-backend/src/modules/blood-samples/services/passcode.service.spec.ts`
- `lims-backend/src/modules/blood-samples/blood-samples.service.spec.ts`
- `lims-backend/src/modules/blood-samples/blood-samples.controller.spec.ts`
- `lims-backend/src/modules/blood-samples/blood-samples.e2e-spec.ts`

**Modified Files:**

- `lims-backend/src/app.module.ts` - Add BloodSamplesModule import