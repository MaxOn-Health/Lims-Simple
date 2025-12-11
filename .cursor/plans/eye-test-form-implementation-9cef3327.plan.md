---
name: Fix Patient Registration to Assignment Flow
overview: ""
todos:
  - id: 2dfc514e-d07c-4bc9-b0f3-b08cd1f1ce04
    content: Create eye.constants.ts with field names, labels, and helper functions for eye test fields
    status: pending
  - id: ac561a4a-a08e-42c0-a854-96185c487545
    content: Create eye-schema.ts with Zod validation schemas for all eye test fields
    status: pending
  - id: bc785a4f-3052-4843-8d38-7bb2e5310c66
    content: Create VisionTable.tsx component for distance and near vision tables (without/with glass for right/left)
    status: pending
  - id: 8b94011c-1ef1-4ef9-a773-d30a147fdde8
    content: Create EyeParametersTable.tsx component for SPH, CYL, AXIS, ADD, VISION parameters (right/left)
    status: pending
  - id: 7066fc17-9805-4e55-aa3f-8d848e983c15
    content: Create EyeTestResultForm.tsx main component integrating all sections (vision tables, parameters, health fields, buttons, remarks)
    status: pending
  - id: de3ba0e5-9842-4222-9786-ef12e0ecab8f
    content: Create index.ts to export all eye test components
    status: pending
  - id: 0fbf2949-5720-48eb-a73a-087963461aae
    content: Update DynamicResultForm.tsx to detect eye tests and use EyeTestResultForm with eye test schema
    status: pending
---

# Fix Patient Registration to Assignment Flow

Review and fix the complete patient registration → payment → assignment → technician access flow to match requirements.

## Issues Found

### 1. Auto-Assignment Not Automatic

- **Current**: Auto-assignment requires a separate API call after patient registration
- **Expected**: Auto-assignment should happen automatically after patient registration
- **Location**: `lims-backend/src/modules/patients/patients.service.ts` - `register()` method

### 2. Payment Information Access

- **Current**: Only RECEPTIONIST/SUPER_ADMIN can update payment
- **Expected**: Technicians should be able to update payment information for their assigned patients
- **Location**: 
- Backend: `lims-backend/src/modules/patients/patients.controller.ts` - `updatePayment()` endpoint
- Frontend: `lims-frontend/src/components/patients/UpdatePaymentModal/UpdatePaymentModal.tsx`

### 3. Technician Assignment Visibility

- **Current**: ✅ Technicians can only see their own assignments via `getMyAssignments()`
- **Current**: ✅ Technicians can only update their own assignment status
- **Current**: ✅ Technicians can only submit results for their assigned tests
- **Status**: ✅ CORRECTLY IMPLEMENTED

## Files to Update

### Backend Changes

1. **`lims-backend/src/modules/patients/patients.service.ts`**

- Add auto-assignment call after patient registration
- Import AssignmentsService
- Call `autoAssign()` after saving patient package

2. **`lims-backend/src/modules/patients/patients.controller.ts`**

- Update `updatePayment()` endpoint to allow TEST_ADMIN and LAB_TECHNICIAN roles
- Add validation: technicians can only update payment for patients they have assignments for

3. **`lims-backend/src/modules/patients/patients.service.ts`**

- Update `updatePayment()` method to validate technician access
- Check if technician has any assignments for the patient

### Frontend Changes

4. **`lims-frontend/src/components/patients/PatientView/PatientView.tsx`**

- Allow TEST_ADMIN and LAB_TECHNICIAN to see/update payment button
- Show payment modal to technicians

5. **`lims-frontend/src/components/patients/UpdatePaymentModal/UpdatePaymentModal.tsx`**

- Ensure it works for technicians (should already work if backend allows)

## Implementation Details

### Auto-Assignment Integration

- Call `assignmentsService.autoAssign()` after patient package is created
- Handle errors gracefully (log but don't fail patient registration)
- Wrap in try-catch to ensure patient registration succeeds even if assignment fails

### Payment Access for Technicians

- Technicians can update payment for any patient they have an assignment for
- Validation: Check if current user (if technician) has at least one assignment for the patient
- Keep existing validation: RECEPTIONIST/SUPER_ADMIN can update payment for any patient

### Assignment Validation

- Keep existing validations:
- Technicians can only see their assignments (`getMyAssignments` filters by `adminId`)
- Technicians can only update status of their assignments (checked in `updateStatus`)
- Technicians can only submit results for their assignments (checked in `submitResult`)

## Testing Checklist

After implementation, verify:

- [ ] Patient registration automatically creates assignments
- [ ] Technicians can update payment for their assigned patients
- [ ] Technicians cannot update payment for patients they don't have assignments for
- [ ] Receptionists/Super Admins can still update payment for any patient
- [ ] Technicians only see their own assignments in dashboard
- [ ] Technicians can only edit results for their assigned tests
- [ ] Assignment filtering works correctly by test type