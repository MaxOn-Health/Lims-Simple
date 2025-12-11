# Phase 3: Enhanced Assignment System

## Goal
Allow receptionists to select a specific technician from a list when assigning tests, instead of only relying on auto-assignment.

## Duration Estimate
2-3 days

## Prerequisites
- Phase 1 and Phase 2 completed successfully
- ProjectMember system working
- Project-scoped access control functional
- Understanding of frontend-backend API integration

---

## 3.1 Backend: Available Technicians Endpoint

### 3.1.1 Add Get Available Technicians Endpoint

#### What to Do
Create an endpoint that returns a list of technicians who can perform a specific test type, filtered by project.

#### Where to Modify
**File Location**: `lims-backend/src/modules/assignments/assignments.controller.ts`

#### How to Do It

##### Step 1: Add GET Endpoint
- Route: `GET /assignments/available-technicians`
- Query parameters:
  - `testId`: string (required) - The test ID to find technicians for
  - `projectId`: string (optional) - Filter by project, defaults to patient's project
- Access: RECEPTIONIST, SUPER_ADMIN
- Use `@Roles()` decorator

##### Step 2: Endpoint Logic
- Get test by testId
- Extract `adminRole` from test (this is the testTechnicianType needed)
- If projectId provided:
  - Use it for filtering
- If projectId not provided:
  - Get from patient's project (if patientId also provided)
  - Or return technicians from all user's projects
- Query technicians where:
  - `role = TEST_TECHNICIAN`
  - `isActive = true`
  - `testTechnicianType = test.adminRole`
  - User is member of project (if projectId provided)
- For each technician, optionally include:
  - Current assignment count (active assignments)
  - Availability status
- Return array of technicians with relevant info

##### Step 3: Response Format
- Return array of objects with:
  - `id`: User ID
  - `fullName`: Technician name
  - `email`: Technician email
  - `testTechnicianType`: Type of technician
  - `currentAssignmentCount`: Number of active assignments (optional)
  - `isAvailable`: Boolean (optional)

##### Step 4: Add Swagger Documentation
- Use `@ApiQuery` for query parameters
- Use `@ApiResponse` for response format
- Add examples

---

### 3.1.2 Create AvailableTechniciansResponseDto

#### What to Do
Create a DTO for the available technicians response.

#### Where to Create
**File Location**: `lims-backend/src/modules/assignments/dto/available-technicians-response.dto.ts`

#### How to Do It
- Define class with properties:
  - `id`: string
  - `fullName`: string
  - `email`: string
  - `testTechnicianType`: string
  - `currentAssignmentCount`: number (optional)
  - `isAvailable`: boolean (optional)
- Use `@ApiProperty` decorators
- Add validation if needed

---

### 3.1.3 Add Service Method

#### What to Do
Create a service method to get available technicians.

#### Where to Modify
**File Location**: `lims-backend/src/modules/assignments/assignments.service.ts`

#### How to Do It

##### Step 1: Add getAvailableTechnicians() Method
- Method signature: `getAvailableTechnicians(testId: string, projectId?: string, includeWorkload?: boolean)`
- Get test by testId
- Validate test exists
- Get adminRole from test
- If projectId provided:
  - Get technicians in project via ProjectMember
  - Filter by testTechnicianType
- If projectId not provided:
  - Get all technicians with matching testTechnicianType
  - Filter by user's accessible projects
- If includeWorkload is true:
  - For each technician, count active assignments
  - Calculate availability status
- Return array of technicians

##### Step 2: Handle Edge Cases
- No technicians available → return empty array
- Test not found → throw NotFoundException
- Invalid projectId → throw BadRequestException
- User doesn't have access to project → throw ForbiddenException

##### Step 3: Performance Considerations
- Use efficient queries
- Consider caching if needed
- Limit result set if too large

---

## 3.2 Backend: Update Assignment Creation

### 3.2.1 Modify CreateAssignmentDto

#### What to Do
Ensure adminId is optional and well-documented.

#### Where to Modify
**File Location**: `lims-backend/src/modules/assignments/dto/create-assignment.dto.ts`

#### How to Do It
- Verify `adminId` is optional
- Add clear `@ApiProperty` description:
  - "If provided, assigns to specific technician"
  - "If not provided, system will auto-assign"
- Add validation:
  - If adminId provided, validate it's a valid UUID
  - Validate admin exists and is active
- Update Swagger documentation

---

### 3.2.2 Update manualAssign() Method

#### What to Do
Enhance the method to better handle optional adminId and project validation.

#### Where to Modify
**File Location**: `lims-backend/src/modules/assignments/assignments.service.ts`

#### How to Do It

##### Step 1: Improve adminId Handling
- If adminId provided:
  - Validate admin exists
  - Validate admin is active
  - Validate admin's testTechnicianType matches test's adminRole
  - Validate admin is in patient's project (use ProjectMember check)
  - Use provided admin
- If adminId not provided:
  - Call AdminSelectionService.findAvailableAdmin() with projectId
  - Use auto-selected admin or leave null

##### Step 2: Add Project Validation
- Get patient's projectId
- If adminId provided:
  - Verify admin is member of patient's project
  - Throw BadRequestException if not
- Ensure assignedBy user has access to patient's project

##### Step 3: Improve Error Messages
- Provide clear error messages:
  - "Technician is not assigned to this project"
  - "Technician type does not match test requirements"
  - "No available technicians in this project"

---

## 3.3 Backend: Update AdminSelectionService

### 3.3.1 Enhance findAvailableAdmin() Method

#### What to Do
Ensure the method properly handles projectId parameter (from Phase 2).

#### Where to Modify
**File Location**: `lims-backend/src/modules/assignments/services/admin-selection.service.ts`

#### How to Do It

##### Step 1: Verify projectId Implementation
- Ensure method signature includes `projectId?: string`
- If projectId provided:
  - Query ProjectMember to get user IDs in project
  - Filter User query to only those users
  - Rest of logic remains same
- If projectId not provided:
  - Use global query (backward compatibility)

##### Step 2: Add Helper Method
- `getTechniciansInProject(projectId: string, adminRole: string): Promise<User[]>`
- Returns all technicians of given type in project
- Can be reused by getAvailableTechnicians()

##### Step 3: Update Error Handling
- Return null if no technicians in project
- Log when project has no matching technicians
- Consider returning more detailed error info

---

## 3.4 Frontend: API Service Updates

### 3.4.1 Update AssignmentsService

#### What to Do
Add method to fetch available technicians.

#### Where to Modify
**File Location**: `lims-frontend/src/services/api/assignments.service.ts`

#### How to Do It

##### Step 1: Add getAvailableTechnicians() Method
- Method signature: `getAvailableTechnicians(testId: string, projectId?: string)`
- Make GET request to `/assignments/available-technicians`
- Pass testId and projectId as query parameters
- Return array of technicians
- Handle errors appropriately

##### Step 2: Update Type Definitions
- Create or update `AvailableTechnician` type
- Include: id, fullName, email, testTechnicianType, currentAssignmentCount?, isAvailable?
- Location: `lims-frontend/src/types/assignment.types.ts`

##### Step 3: Add Error Handling
- Handle cases:
  - Test not found
  - No technicians available
  - Network errors
- Show user-friendly error messages

---

## 3.5 Frontend: Technician Selector Component

### 3.5.1 Create TechnicianSelector Component

#### What to Do
Create a reusable component for selecting technicians from a dropdown/modal.

#### Where to Create
**File Location**: `lims-frontend/src/components/assignments/TechnicianSelector/TechnicianSelector.tsx`

#### How to Do It

##### Step 1: Component Props
- `testId`: string (required) - Test to find technicians for
- `projectId?: string` - Project to filter by
- `selectedTechnicianId?: string` - Currently selected technician
- `onSelect`: (technicianId: string) => void - Callback when technician selected
- `onCancel?: () => void` - Callback for cancel action
- `showAutoAssign?: boolean` - Show "Auto-Assign" option
- `onAutoAssign?: () => void` - Callback for auto-assign

##### Step 2: Component State
- `technicians`: AvailableTechnician[] - List of technicians
- `loading`: boolean - Loading state
- `error`: string | null - Error message
- `selectedId`: string | null - Currently selected technician ID

##### Step 3: Component Logic
- On mount or when testId/projectId changes:
  - Call `assignmentsService.getAvailableTechnicians()`
  - Set loading state
  - Handle errors
  - Update technicians list
- Display technicians in dropdown/select:
  - Show technician name
  - Show technician type
  - Show current workload (if available)
  - Show availability status
- Handle selection:
  - Call `onSelect` with selected technician ID
  - Close dropdown/modal
- If showAutoAssign:
  - Show "Auto-Assign" button
  - Call `onAutoAssign` when clicked

##### Step 4: UI Design
- Use shadcn/ui Select or DropdownMenu component
- Show loading spinner while fetching
- Show empty state if no technicians
- Show error message if fetch fails
- Highlight selected technician
- Make it accessible (keyboard navigation, ARIA labels)

##### Step 5: Styling
- Match existing design system
- Responsive design
- Clear visual hierarchy
- Hover states for items

---

## 3.6 Frontend: Update Assignment Table Component

### 3.6.1 Modify AssignmentTable Component

#### What to Do
Update the assignment table to allow technician selection when assigning tests.

#### Where to Modify
**File Location**: `lims-frontend/src/components/assignments/AssignmentTable/AssignmentTable.tsx`

#### How to Do It

##### Step 1: Add Technician Selection Flow
- When "Assign" button clicked:
  - Check if multiple technicians available
  - If multiple: Show TechnicianSelector component
  - If single: Auto-assign or show confirmation
  - If none: Show message "No technicians available"

##### Step 2: Update Assign Button Handler
- Current behavior: Directly calls assignment API
- New behavior:
  - Fetch available technicians for the test
  - If technicians available:
    - Show TechnicianSelector modal/dropdown
    - Wait for user selection
    - Call assignment API with selected technicianId
  - If no technicians:
    - Show error message
    - Optionally allow auto-assign anyway

##### Step 3: Add State Management
- Add state for:
  - Selected test for assignment
  - Available technicians
  - TechnicianSelector visibility
  - Loading state for technician fetch

##### Step 4: Update UI
- Add TechnicianSelector component
- Show it as modal or dropdown when assigning
- Update "Assign" button to show loading state
- Show technician name after assignment (if assigned)

##### Step 5: Handle Edge Cases
- No technicians available → Show message, allow auto-assign option
- Single technician → Auto-select or show confirmation
- Assignment fails → Show error, allow retry
- Network error → Show error message

---

## 3.7 Frontend: Update Manual Assignment Page

### 3.7.1 Modify Manual Assignment Form

#### What to Do
Update the manual assignment form to include technician selection.

#### Where to Modify
**File Location**: `lims-frontend/src/app/assignments/manual-assign/page.tsx` or component file

#### How to Do It

##### Step 1: Add Technician Selection Field
- After test selection:
  - Fetch available technicians for selected test
  - Show TechnicianSelector component
  - Allow user to select technician or choose "Auto-Assign"
- Make technician selection required (or allow auto-assign)

##### Step 2: Update Form Validation
- If technician not selected and auto-assign not chosen:
  - Show validation error
  - Prevent form submission

##### Step 3: Update Form Submission
- Include selected technicianId in submission
- If auto-assign chosen, omit technicianId
- Handle submission errors

##### Step 4: Improve UX
- Show loading state while fetching technicians
- Show message if no technicians available
- Pre-select technician if only one available
- Show technician workload/availability info

---

## 3.8 Frontend: Update Auto-Assignment Page

### 3.8.1 Enhance Auto-Assignment UI

#### What to Do
Show which technician will be assigned for each test before confirming auto-assignment.

#### Where to Modify
**File Location**: `lims-frontend/src/app/assignments/auto-assign/page.tsx` or component file

#### How to Do It

##### Step 1: Preview Assignments
- Before auto-assigning:
  - For each test, fetch available technicians
  - Show which technician will be assigned (based on workload)
  - Allow user to override selection for specific tests

##### Step 2: Add Override Option
- For each test in preview:
  - Show assigned technician name
  - Add "Change" button
  - Open TechnicianSelector when clicked
  - Update preview with new selection

##### Step 3: Update Confirmation
- Show summary of assignments:
  - Test name → Technician name
  - Tests that will be auto-assigned
  - Tests with manual technician selection
- Allow user to confirm or cancel

##### Step 4: Handle Edge Cases
- Some tests have no technicians → Show warning, allow to proceed
- All tests have technicians → Show all assignments
- Mixed scenario → Show both auto and manual assignments

---

## 3.9 Frontend: Update Assignment Detail View

### 3.9.1 Show Technician Information

#### What to Do
Display assigned technician information and allow reassignment.

#### Where to Modify
**File Location**: `lims-frontend/src/app/assignments/[id]/page.tsx` or component file

#### How to Do It

##### Step 1: Display Technician Info
- Show assigned technician name and email
- Show technician type
- Show current workload (if available)
- Show assignment date

##### Step 2: Add Reassign Option
- If assignment not submitted:
  - Show "Reassign" button
  - On click: Show TechnicianSelector
  - Allow selection of new technician
  - Update assignment via API
  - Show success message

##### Step 3: Update UI
- Use Card component to show technician details
- Add icons for technician type
- Show status badge
- Make reassign button prominent but not intrusive

---

## 3.10 Frontend: Update My Assignments Page

### 3.10.1 Enhance Admin Dashboard

#### What to Do
Show technician information and allow admins to see who else is available.

#### Where to Modify
**File Location**: `lims-frontend/src/app/assignments/my-assignments/page.tsx` or component file

#### How to Do It

##### Step 1: Show Assignment Context
- For each assignment:
  - Show patient info
  - Show test info
  - Show that it's assigned to current user
  - Show other available technicians (optional, for info)

##### Step 2: Add Information Display
- Show total assignments for current user
- Show assignments by status
- Show workload compared to other technicians (optional)

##### Step 3: Keep Existing Functionality
- Don't break existing assignment management
- Keep status update functionality
- Keep result submission functionality

---

## 3.11 Error Handling & Edge Cases

### 3.11.1 Handle No Technicians Scenario

#### What to Do
Provide clear feedback when no technicians are available.

#### How to Handle
- Backend: Return empty array, don't throw error
- Frontend: Show message "No technicians available for this test type in this project"
- Options:
  - Allow assignment without technician (status: PENDING)
  - Suggest adding technician to project
  - Allow cross-project assignment (if SUPER_ADMIN)

---

### 3.11.2 Handle Technician Removed from Project

#### What to Do
Handle case where assigned technician is removed from project.

#### How to Handle
- On assignment query:
  - Check if assigned technician still in project
  - If not: Show warning, allow reassignment
- On technician removal:
  - Optionally reassign affected assignments
  - Or mark assignments as PENDING

---

### 3.11.3 Handle Multiple Projects

#### What to Do
Handle case where user has access to multiple projects.

#### How to Handle
- When fetching technicians:
  - Default to patient's project
  - Allow user to select different project (if SUPER_ADMIN)
  - Show project context in UI

---

## 3.12 Testing Requirements

### Backend Tests

#### What to Test
- getAvailableTechnicians() returns correct technicians
- Filters by project correctly
- Includes/excludes workload info correctly
- Handles edge cases (no technicians, invalid test, etc.)

#### Where to Create Tests
- `lims-backend/src/modules/assignments/assignments.service.spec.ts`
- `lims-backend/src/modules/assignments/assignments.controller.spec.ts`

#### How to Test
- Mock repositories
- Test with different project scenarios
- Test with different technician types
- Test error cases

---

### Frontend Tests

#### What to Test
- TechnicianSelector component renders correctly
- Fetches and displays technicians
- Handles selection correctly
- Handles errors correctly
- Integration with AssignmentTable

#### Where to Create Tests
- `lims-frontend/src/components/assignments/TechnicianSelector/TechnicianSelector.test.tsx`
- Update AssignmentTable tests

#### How to Test
- Mock API calls
- Test user interactions
- Test error scenarios
- Test loading states

---

## 3.13 Verification Checklist

Before moving to Phase 4, verify:

- [ ] Backend endpoint for available technicians created
- [ ] Service method implemented
- [ ] DTOs created
- [ ] Project filtering works correctly
- [ ] Workload calculation works (if implemented)
- [ ] Frontend API service updated
- [ ] TechnicianSelector component created
- [ ] AssignmentTable updated with technician selection
- [ ] Manual assignment form updated
- [ ] Auto-assignment preview works
- [ ] Assignment detail view shows technician info
- [ ] Reassignment works
- [ ] Error handling implemented
- [ ] Edge cases handled
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] UI is responsive and accessible
- [ ] Swagger documentation updated

---

## 3.14 Common Pitfalls to Avoid

1. **Not handling empty technician list** - Always provide fallback option
2. **Forgetting project filtering** - Technicians must be filtered by project
3. **Not validating technician type** - Ensure technician can perform the test
4. **Poor UX** - Don't make user wait unnecessarily, show loading states
5. **Not handling reassignment** - Allow changing technician if needed
6. **Missing error messages** - Provide clear feedback for all scenarios
7. **Not testing edge cases** - Test with 0, 1, and many technicians

---

## 3.15 Next Steps

After completing Phase 3:
1. Test technician selection thoroughly
2. Verify project filtering works
3. Test with multiple projects and technicians
4. Verify error handling
5. Proceed to Phase 4 only after all checklist items are complete


