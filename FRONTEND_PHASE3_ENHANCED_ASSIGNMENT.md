# Frontend Phase 3: Enhanced Assignment System UI

## Goal
Allow receptionists to select specific technicians when assigning tests, with a user-friendly interface showing available technicians filtered by project.

## Duration Estimate
2-3 days

## Prerequisites
- Backend Phase 3 completed
- Available technicians API endpoint working
- Frontend Phase 2 completed
- Project-scoped access working

---

## 3.1 Create Technician Selector Component

### 3.1.1 Create TechnicianSelector Component

#### What to Do
Create a reusable component for selecting technicians from a dropdown/modal, showing available technicians for a specific test type in a project.

#### Where to Create
**File Location**: `lims-frontend/src/components/assignments/TechnicianSelector/TechnicianSelector.tsx`

#### How to Do It

##### Step 1: Component Props
- `testId: string` (required) - Test to find technicians for
- `projectId?: string` - Project to filter by (optional, defaults to patient's project)
- `selectedTechnicianId?: string` - Currently selected technician ID
- `onSelect: (technicianId: string | null) => void` - Callback when technician selected
- `onCancel?: () => void` - Callback for cancel action
- `showAutoAssign?: boolean` - Show "Auto-Assign" option
- `onAutoAssign?: () => void` - Callback for auto-assign
- `isOpen: boolean` - Control visibility
- `onClose: () => void` - Close handler

##### Step 2: Component State
- `technicians: AvailableTechnician[]` - List of available technicians
- `loading: boolean` - Loading state while fetching
- `error: string | null` - Error message
- `searchQuery: string` - Search filter for technicians

##### Step 3: Fetch Technicians Logic
- On mount or when testId/projectId changes:
  - Call `assignmentsService.getAvailableTechnicians(testId, projectId)`
  - Set loading state
  - Handle errors gracefully
  - Update technicians list
- Debounce search query if implementing search

##### Step 4: Component Structure
- Modal/Dialog wrapper (use shadcn/ui Dialog)
- Header:
  - Title: "Select Technician"
  - Close button
- Search bar (optional):
  - Filter technicians by name
  - Real-time search
- Technicians list:
  - Scrollable list
  - Each technician as selectable card/item
  - Show technician details
- Footer:
  - "Auto-Assign" button (if enabled)
  - "Cancel" button
  - "Select" button (if selection made)

##### Step 5: Technician Item Design
- Use shadcn/ui components (Card or List item)
- Show:
  - Technician name (prominent)
  - Technician email
  - Technician type badge
  - Current workload (if available):
    - "X active assignments"
    - Progress bar or number
  - Availability status badge
- Highlight selected technician
- Hover effects
- Click to select

##### Step 6: Selection Handling
- When technician clicked:
  - Highlight selection
  - Update selectedTechnicianId state
  - Enable "Select" button
- When "Select" clicked:
  - Call `onSelect(selectedTechnicianId)`
  - Close modal
- When "Auto-Assign" clicked:
  - Call `onAutoAssign()` if provided
  - Or call `onSelect(null)` to indicate auto-assign
  - Close modal

##### Step 7: Loading State
- Show skeleton loaders while fetching
- Disable interaction during load
- Show loading spinner in header

##### Step 8: Empty State
- If no technicians available:
  - Show message: "No technicians available for this test type in this project"
  - Show "Auto-Assign" option (if enabled)
  - Provide helpful information

##### Step 9: Error Handling
- Show error message if fetch fails
- Allow retry
- Show user-friendly error text
- Log error for debugging

##### Step 10: Accessibility
- Keyboard navigation (arrow keys, Enter, Escape)
- ARIA labels
- Focus management
- Screen reader support

---

## 3.2 Update Assignment Table Component

### 3.2.1 Modify AssignmentTable Component

#### What to Do
Update the assignment table to show technician selection when assigning tests.

#### Where to Modify
**File Location**: `lims-frontend/src/components/assignments/AssignmentTable/AssignmentTable.tsx`

#### How to Do It

##### Step 1: Add Technician Selection State
- `selectedTestForAssignment: string | null` - Test ID being assigned
- `showTechnicianSelector: boolean` - Control TechnicianSelector visibility
- `availableTechnicians: AvailableTechnician[]` - Cached technicians list

##### Step 2: Update Assign Button Handler
- Current behavior: Directly calls assignment API
- New behavior:
  - When "Assign" clicked:
    - Get test ID and patient ID
    - Get patient's projectId
    - Fetch available technicians for test
    - Show TechnicianSelector modal
  - Wait for user selection:
    - If technician selected: Call assignment API with technicianId
    - If auto-assign chosen: Call assignment API without technicianId
    - Handle success/error

##### Step 3: Add TechnicianSelector Integration
- Import TechnicianSelector component
- Render when `showTechnicianSelector` is true
- Pass required props:
  - testId
  - projectId (from patient)
  - onSelect handler
  - onAutoAssign handler
  - onClose handler

##### Step 4: Update Assignment Display
- Show assigned technician name (if assigned)
- Show "Unassigned" badge if no technician
- Show technician type badge
- Make technician name clickable (show details or allow change)

##### Step 5: Add Reassign Functionality
- If assignment exists but not submitted:
  - Show "Change Technician" button
  - On click: Open TechnicianSelector
  - Allow selecting new technician
  - Update assignment via API

##### Step 6: Handle Edge Cases
- No technicians available:
  - Show warning icon
  - Disable assign button or show message
  - Allow auto-assign option
- Single technician:
  - Auto-select or show confirmation
  - Streamline flow
- Network error:
  - Show error message
  - Allow retry

##### Step 7: Update Loading States
- Show loading spinner on assign button while fetching technicians
- Show loading state during assignment creation
- Disable buttons during operations

##### Step 8: Update Success Feedback
- Show success toast/message
- Update table row with new assignment
- Highlight newly assigned row
- Refresh assignment list

---

## 3.3 Update Manual Assignment Page

### 3.3.1 Modify Manual Assignment Form

#### What to Do
Update the manual assignment form to include technician selection.

#### Where to Modify
**File Location**: `lims-frontend/src/app/assignments/manual-assign/page.tsx` or form component

#### How to Do It

##### Step 1: Add Technician Selection Field
- After test selection:
  - Fetch available technicians for selected test
  - Show TechnicianSelector or inline selector
  - Allow selecting technician or choosing "Auto-Assign"
- Make field visible and interactive

##### Step 2: Update Form Layout
- Add "Technician" section:
  - Label: "Assign to Technician"
  - TechnicianSelector component or dropdown
  - "Auto-Assign" checkbox or button
  - Selected technician display

##### Step 3: Update Form Validation
- If technician not selected and auto-assign not chosen:
  - Show validation error
  - Prevent form submission
  - Highlight field

##### Step 4: Update Form Schema (Zod)
- Add `technicianId?: string` field
- Add validation:
  - Either technicianId or autoAssign must be true
  - technicianId must be valid UUID if provided

##### Step 5: Update Form Submission
- Include selected technicianId in submission (if selected)
- If auto-assign chosen, omit technicianId
- Handle API response
- Show success message
- Redirect or refresh

##### Step 6: Improve UX
- Show loading state while fetching technicians
- Show message if no technicians available
- Pre-select technician if only one available
- Show technician workload info
- Disable form while submitting

##### Step 7: Handle Patient Selection
- When patient selected:
  - Get patient's projectId
  - Use it for technician filtering
  - Update available technicians

---

## 3.4 Update Auto-Assignment Page

### 3.4.1 Enhance Auto-Assignment Preview

#### What to Do
Show which technician will be assigned for each test before confirming auto-assignment.

#### Where to Modify
**File Location**: `lims-frontend/src/app/assignments/auto-assign/page.tsx` or component

#### How to Do It

##### Step 1: Create Assignment Preview
- Before auto-assigning:
  - For each test in patient's package/addons:
    - Fetch available technicians
    - Determine which technician will be assigned (based on workload)
    - Show preview card with:
      - Test name
      - Assigned technician name (or "Auto-Assign")
      - Technician type
      - Current workload

##### Step 2: Preview Card Design
- Use Card component for each test
- Show:
  - Test name (heading)
  - Technician info:
    - Name and email
    - Type badge
    - Workload indicator
  - "Change" button (if multiple technicians)
- Group by project if multiple projects

##### Step 3: Add Override Functionality
- For each test in preview:
  - Add "Change Technician" button
  - On click: Open TechnicianSelector
  - Allow selecting different technician
  - Update preview with new selection
  - Mark as "Manual Selection"

##### Step 4: Update Confirmation Dialog
- Show summary before confirming:
  - Tests that will be auto-assigned
  - Tests with manual technician selection
  - Total assignments to create
- Allow user to:
  - Confirm and proceed
  - Go back and make changes
  - Cancel

##### Step 5: Handle Edge Cases
- Some tests have no technicians:
  - Show warning badge
  - Show "Will be assigned when technician available"
  - Allow proceeding or skipping
- All tests have technicians:
  - Show all assignments
  - Highlight any manual selections
- Mixed scenario:
  - Show both auto and manual assignments
  - Color code by assignment type

##### Step 6: Update Submission
- Submit assignments:
  - Include technicianId for manual selections
  - Omit technicianId for auto-assignments
- Handle batch creation
- Show progress indicator
- Handle partial failures

---

## 3.5 Update Assignment Detail Page

### 3.5.1 Show Technician Information

#### What to Do
Display assigned technician information and allow reassignment.

#### Where to Modify
**File Location**: `lims-frontend/src/app/assignments/[id]/page.tsx` or component

#### How to Do It

##### Step 1: Display Technician Info
- Add "Assigned Technician" section:
  - Show technician name (prominent)
  - Show technician email
  - Show technician type badge
  - Show assignment date
  - Show current workload (if available)
- Use Card component for layout

##### Step 2: Add Reassign Option
- If assignment not submitted:
  - Show "Reassign" button
  - On click:
    - Fetch available technicians for test
    - Show TechnicianSelector
    - Allow selecting new technician
    - Update assignment via API
    - Show success message
    - Refresh assignment details

##### Step 3: Update UI Layout
- Use shadcn/ui components:
  - Card for technician info
  - Badge for technician type
  - Button for reassign action
- Show status badge
- Make reassign button prominent but not intrusive

##### Step 4: Show Assignment History (Optional)
- Show previous technicians (if reassigned)
- Show assignment timeline
- Show who made the assignment/reassignment

##### Step 5: Handle Edge Cases
- No technician assigned:
  - Show "Unassigned" badge
  - Show "Assign Now" button
  - Allow immediate assignment
- Technician removed from project:
  - Show warning
  - Allow reassignment
  - Show "Technician no longer in project" message

---

## 3.6 Update My Assignments Page

### 3.6.1 Enhance Admin Dashboard

#### What to Do
Show technician context and allow admins to see assignment distribution.

#### Where to Modify
**File Location**: `lims-frontend/src/app/assignments/my-assignments/page.tsx` or component

#### How to Do It

##### Step 1: Show Assignment Context
- For each assignment:
  - Show patient info (existing)
  - Show test info (existing)
  - Show that it's assigned to current user
  - Show project name/badge
  - Show other available technicians count (optional, for info)

##### Step 2: Add Statistics Display
- Show total assignments for current user
- Show assignments by status
- Show workload compared to other technicians (optional):
  - "You have X assignments"
  - "Average: Y assignments per technician"
- Show by project breakdown

##### Step 3: Add Filter Options
- Filter by project
- Filter by test type
- Filter by status
- Show filter chips

##### Step 4: Keep Existing Functionality
- Don't break existing assignment management
- Keep status update functionality
- Keep result submission functionality
- Keep search functionality

##### Step 5: Add Quick Actions
- "Reassign" quick action (if allowed)
- Bulk status updates (if needed)
- Export assignments (optional)

---

## 3.7 Update Assignment API Service

### 3.7.1 Add Available Technicians Method

#### What to Do
Add method to fetch available technicians for a test.

#### Where to Modify
**File Location**: `lims-frontend/src/services/api/assignments.service.ts`

#### How to Do It

##### Step 1: Add getAvailableTechnicians() Method
- Method signature: `getAvailableTechnicians(testId: string, projectId?: string)`
- Make GET request to `/assignments/available-technicians`
- Pass testId and projectId as query parameters
- Return `Promise<AvailableTechnician[]>`
- Handle errors appropriately

##### Step 2: Update Type Definitions
- Create or update `AvailableTechnician` type:
  ```typescript
  interface AvailableTechnician {
    id: string;
    fullName: string;
    email: string;
    testTechnicianType: string;
    currentAssignmentCount?: number;
    isAvailable?: boolean;
  }
  ```
- Location: `lims-frontend/src/types/assignment.types.ts`

##### Step 3: Add Error Handling
- Handle cases:
  - Test not found (404)
  - No technicians available (empty array)
  - Network errors
  - Project access denied (403)
- Show user-friendly error messages
- Return empty array on "no technicians" (not an error)

##### Step 4: Add Caching (Optional)
- Cache technicians list per test+project combination
- Invalidate cache when assignments change
- Set TTL for cache entries

---

## 3.8 Update Assignment Types

### 3.8.1 Update Type Definitions

#### What to Do
Ensure all assignment-related types include technician information.

#### Where to Modify
**File Location**: `lims-frontend/src/types/assignment.types.ts`

#### How to Do It

##### Step 1: Update Assignment Interface
- Ensure includes:
  - `adminId?: string | null`
  - `admin?: User` (if backend returns full object)
  - `assignedAt?: Date | string`
  - `assignedBy?: string`

##### Step 2: Add AvailableTechnician Interface
- As defined in section 3.7.1

##### Step 3: Update CreateAssignmentDto Type
- Ensure `adminId` is optional
- Match backend DTO structure

---

## 3.9 Create Assignment Status Badge Component

### 3.9.1 Create StatusBadge Component (if not exists)

#### What to Do
Create or update component for showing assignment status with technician info.

#### Where to Create/Modify
**File Location**: `lims-frontend/src/components/assignments/AssignmentStatusBadge/AssignmentStatusBadge.tsx`

#### How to Do It

##### Step 1: Component Props
- `status: AssignmentStatus` - Assignment status
- `technicianName?: string` - Assigned technician name
- `showTechnician?: boolean` - Show technician info

##### Step 2: Design
- Show status badge with color:
  - PENDING: Gray
  - ASSIGNED: Blue
  - IN_PROGRESS: Yellow
  - COMPLETED: Green
  - SUBMITTED: Purple
- If technician assigned and showTechnician:
  - Show technician name below badge
  - Or show in tooltip
- Use shadcn/ui Badge component

---

## 3.10 Error Handling & Edge Cases

### 3.10.1 Handle No Technicians Scenario

#### What to Do
Provide clear feedback when no technicians are available.

#### How to Handle
- Backend returns empty array (not error)
- Frontend shows:
  - Message: "No technicians available for this test type in this project"
  - Options:
    - "Assign when technician available" (create PENDING assignment)
    - "Add technician to project" (link to project management)
    - "Auto-assign from other projects" (if SUPER_ADMIN)
- Don't block user, provide alternatives

---

### 3.10.2 Handle Technician Removed from Project

#### What to Do
Handle case where assigned technician is removed from project.

#### How to Handle
- On assignment load:
  - Check if technician still in project
  - If not: Show warning badge
  - Show "Reassign" button prominently
  - Allow immediate reassignment
- On technician removal (if admin):
  - Optionally show affected assignments
  - Offer bulk reassignment

---

### 3.10.3 Handle Multiple Projects

#### What to Do
Handle case where user has access to multiple projects.

#### How to Handle
- When fetching technicians:
  - Default to patient's project
  - Show project context
  - Allow selecting different project (if SUPER_ADMIN)
- Show project name in TechnicianSelector
- Filter technicians by selected project

---

## 3.11 Testing Requirements

### Component Tests

#### What to Test
- TechnicianSelector component:
  - Renders correctly
  - Fetches technicians
  - Handles selection
  - Handles errors
  - Handles empty state
- AssignmentTable integration:
  - Shows technician selector
  - Handles assignment creation
  - Updates display after assignment

#### Where to Create Tests
- `lims-frontend/src/components/assignments/TechnicianSelector/TechnicianSelector.test.tsx`
- Update AssignmentTable tests

#### How to Test
- Mock API calls
- Test user interactions
- Test error scenarios
- Test loading states
- Test edge cases

---

### Integration Tests

#### What to Test
- Full assignment flow:
  - Select test
  - Choose technician
  - Create assignment
  - Verify assignment created
- Auto-assignment flow:
  - Preview assignments
  - Override selections
  - Confirm and create

#### How to Test
- Use test data with multiple technicians
- Test with different project scenarios
- Verify API calls are correct
- Verify UI updates correctly

---

## 3.12 Verification Checklist

Before moving to Frontend Phase 4, verify:

- [ ] TechnicianSelector component created
- [ ] Component fetches technicians correctly
- [ ] Component handles selection correctly
- [ ] Component handles errors correctly
- [ ] AssignmentTable updated with technician selection
- [ ] Manual assignment form updated
- [ ] Auto-assignment preview works
- [ ] Assignment detail shows technician info
- [ ] Reassignment works
- [ ] My Assignments page enhanced
- [ ] API service method added
- [ ] Type definitions updated
- [ ] Error handling implemented
- [ ] Edge cases handled
- [ ] Loading states implemented
- [ ] Empty states implemented
- [ ] UI is responsive
- [ ] Accessibility requirements met
- [ ] Component tests written
- [ ] Integration tests written
- [ ] Manual testing completed

---

## 3.13 Common Pitfalls to Avoid

1. **Not handling empty technician list** - Always provide fallback option
2. **Forgetting project filtering** - Technicians must be filtered by project
3. **Poor UX for selection** - Make it easy to see and select technicians
4. **Not showing workload** - Help users make informed decisions
5. **Missing loading states** - Show feedback during operations
6. **Not handling errors** - Provide clear error messages
7. **Forgetting reassignment** - Allow changing technician if needed
8. **Not testing edge cases** - Test with 0, 1, and many technicians

---

## 3.14 Next Steps

After completing Frontend Phase 3:
1. Test technician selection thoroughly
2. Verify project filtering works
3. Test with multiple projects and technicians
4. Verify error handling
5. Test reassignment flow
6. Proceed to Frontend Phase 4 only after all checklist items are complete


