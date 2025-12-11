# Frontend Phase 1: Project Member Foundation UI

## Goal
Update frontend components to support project team management, multi-day project dates (startDate/endDate), and display project members.

## Duration Estimate
2-3 days

## Prerequisites
- Backend Phase 1 completed
- API endpoints for project members available
- Understanding of React hooks and form handling
- shadcn/ui components available

---

## 1.1 Update Type Definitions

### 1.1.1 Update Project Types

#### What to Do 
Update TypeScript types to reflect backend changes: startDate/endDate instead of campDate, and add ProjectMember type.

#### Where to Modify
**File Location**: `lims-frontend/src/types/project.types.ts`

#### How to Do It

##### Step 1: Update Project Interface
- Find `campDate` property
- Rename to `startDate: Date | string | null`
- Add `endDate: Date | string | null`
- Keep all other properties unchanged

##### Step 2: Add ProjectMember Interface
- Create new interface:
  ```typescript
  interface ProjectMember {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userRole: UserRole;
    roleInProject?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  }
  ```

##### Step 3: Update ProjectResponse Interface
- Add `members?: ProjectMember[]` property (optional, for detailed views)
- Update date fields to match backend

##### Step 4: Create ProjectMemberResponse Type
- If backend returns separate DTO, create matching type
- Include all fields from ProjectMember interface

---

### 1.1.2 Update API Service Types

#### What to Do
Update API service method signatures to use new field names.

#### Where to Modify
**File Location**: `lims-frontend/src/services/api/projects.service.ts`

#### How to Do It
- Review all method signatures
- Update any references to `campDate` → `startDate`
- Add `endDate` parameter where needed
- Add `memberIds` parameter to create/update methods
- Update return types to match updated Project interface

---

## 1.2 Update Project Form Component

### 1.2.1 Modify ProjectForm Component

#### What to Do
Update the project creation/edit form to:
1. Use startDate/endDate instead of campDate
2. Add date range picker
3. Add team member selection

#### Where to Modify
**File Location**: `lims-frontend/src/components/projects/ProjectForm/ProjectForm.tsx`

#### How to Do It

##### Step 1: Update Form Fields
- Find `campDate` field
- Replace with two fields:
  - `startDate`: Date picker
  - `endDate`: Date picker (optional)
- Use shadcn/ui DatePicker or similar component
- Add validation:
  - Start date is required
  - End date must be after start date (if provided)
  - End date is optional

##### Step 2: Add Date Range Picker
- Use date-fns for date handling
- Implement date range selection:
  - Start date picker
  - End date picker
  - Show date range preview
  - Handle date formatting for API

##### Step 3: Add Team Member Selection
- Add new section: "Team Members"
- Create multi-select component:
  - Fetch all users (or filter by role)
  - Group users by role:
    - Receptionists
    - Test Technicians (grouped by type)
    - Lab Technicians
    - Doctors
  - Allow selecting multiple users
  - Show selected users with badges
  - Allow removing selected users

##### Step 4: Update Form Schema (Zod)
- Update validation schema:
  - `startDate`: required, date
  - `endDate`: optional, date, must be after startDate
  - `memberIds`: optional, array of UUIDs
- Add custom validation for date range

##### Step 5: Update Form Submission
- Format dates for API (ISO string format)
- Include `memberIds` array in submission
- Handle API response
- Show success message
- Redirect or refresh on success

##### Step 6: Update Edit Mode
- Pre-populate form with existing data
- Pre-select existing team members
- Show current members list
- Allow adding/removing members

##### Step 7: Improve UX
- Show loading state while fetching users
- Show error if user fetch fails
- Disable form while submitting
- Show validation errors clearly
- Add help text for date range

---

## 1.3 Create Project Member Manager Component

### 1.3.1 Create ProjectMemberManager Component

#### What to Do
Create a reusable component for managing project members (viewing, adding, removing).

#### Where to Create
**File Location**: `lims-frontend/src/components/projects/ProjectMemberManager/ProjectMemberManager.tsx`

#### How to Do It

##### Step 1: Component Props
- `projectId`: string (required)
- `members`: ProjectMember[] (required) - Current members
- `onAddMember`: (userId: string) => Promise<void> - Callback for adding
- `onRemoveMember`: (userId: string) => void - Callback for removing
- `readOnly?: boolean` - If true, hide add/remove buttons
- `currentUserRole?: UserRole` - For permission checks

##### Step 2: Component Structure
- Header section:
  - Title: "Team Members"
  - Add member button (if not readOnly)
- Members list:
  - Card/list of members
  - Each member shows:
    - User name and email
    - User role badge
    - Role in project (if applicable)
    - Remove button (if not readOnly and has permission)
- Empty state:
  - Show message if no members
  - Show "Add Member" button

##### Step 3: Add Member Flow
- Click "Add Member" button
- Open modal/dialog with:
  - User search/select dropdown
  - Filter by role (optional)
  - Search functionality
  - List of available users (not already members)
  - Select user and confirm
- Call `onAddMember` callback
- Show loading state
- Handle success/error
- Refresh members list

##### Step 4: Remove Member Flow
- Click remove button on member card
- Show confirmation dialog:
  - "Remove [UserName] from project?"
  - Warning about impact (if any)
- On confirm, call `onRemoveMember` callback
- Show loading state
- Handle success/error
- Refresh members list

##### Step 5: Member Card Design
- Use shadcn/ui Card component
- Show user avatar (initials or icon)
- Show user name prominently
- Show user email
- Show role badge with color coding:
  - Receptionist: Blue
  - Test Technician: Green
  - Lab Technician: Purple
  - Doctor: Red
- Show roleInProject if applicable
- Show remove button (if allowed)

##### Step 6: Grouping Members
- Group by role for better organization
- Use Accordion or Tabs for role groups
- Show count per role

##### Step 7: Loading States
- Show skeleton loaders while fetching members
- Show loading spinner on add/remove actions
- Disable buttons during operations

##### Step 8: Error Handling
- Show error message if fetch fails
- Show error message if add/remove fails
- Allow retry on error

---

## 1.4 Update Project Detail Page

### 1.4.1 Modify Project Detail Page

#### What to Do
Update the project detail page to show:
1. Start date and end date
2. Team members section
3. Updated project information

#### Where to Modify
**File Location**: `lims-frontend/src/app/projects/[id]/page.tsx`

#### How to Do It

##### Step 1: Update Project Information Display
- Find `campDate` display
- Replace with:
  - Start Date: [formatted date]
  - End Date: [formatted date] or "Ongoing" if null
- Use date-fns format function
- Show date range: "Dec 10 - Dec 14, 2024" or "Dec 10 - Ongoing"

##### Step 2: Add Team Members Section
- Add new section/tab: "Team"
- Use ProjectMemberManager component
- Pass project members from API
- Handle add/remove member callbacks
- Show member count in header

##### Step 3: Add Tabs (Optional Enhancement)
- Create tabs for:
  - Overview (project info)
  - Team (members)
  - Patients (patients in project - Phase 2)
  - Statistics (optional)
- Use shadcn/ui Tabs component

##### Step 4: Update API Call
- Fetch project with members included
- Or make separate API call for members
- Handle loading state
- Handle error state

##### Step 5: Update Edit Button
- Link to edit page
- Pass project data
- Ensure edit form handles new fields

---

## 1.5 Update Project List Component

### 1.5.1 Modify ProjectList Component

#### What to Do
Update project list/cards to show startDate/endDate and member count.

#### Where to Modify
**File Location**: `lims-frontend/src/components/projects/ProjectList/ProjectList.tsx` or similar

#### How to Do It

##### Step 1: Update Project Card
- Find `campDate` display
- Replace with date range display:
  - Show "Start: [date]" and "End: [date]" or "Ongoing"
  - Or show compact format: "Dec 10 - Dec 14"
- Add member count badge:
  - Show number of team members
  - Use Badge component
  - Link to project detail team section

##### Step 2: Update Project Table (if exists)
- Update date column header: "Date Range" or "Start Date"
- Show date range in cell
- Add "Members" column showing count
- Make members count clickable (link to detail)

##### Step 3: Update Filters
- Find `campDate` filters
- Replace with:
  - Start Date From filter
  - Start Date To filter
  - Or date range picker
- Update API query parameters

##### Step 4: Update Sorting
- Update sort options:
  - Remove "Camp Date" sort
  - Add "Start Date" sort
  - Add "End Date" sort
  - Add "Member Count" sort

---

## 1.6 Update Project API Service

### 1.6.1 Modify ProjectsService

#### What to Do
Update API service methods to use new field names and add member management methods.

#### Where to Modify
**File Location**: `lims-frontend/src/services/api/projects.service.ts`

#### How to Do It

##### Step 1: Update createProject() Method
- Update request body:
  - Change `campDate` → `startDate`
  - Add `endDate` field
  - Add `memberIds` array
- Format dates as ISO strings
- Handle response with new field names

##### Step 2: Update updateProject() Method
- Same changes as createProject
- Ensure partial updates work correctly

##### Step 3: Update getProject() Method
- Update response type to include new fields
- Optionally fetch members separately or include in response

##### Step 4: Add addProjectMember() Method
- Method signature: `addProjectMember(projectId: string, userId: string, roleInProject?: string)`
- Make POST request to `/projects/:projectId/members`
- Return updated member or project
- Handle errors

##### Step 5: Add removeProjectMember() Method
- Method signature: `removeProjectMember(projectId: string, userId: string)`
- Make DELETE request to `/projects/:projectId/members/:userId`
- Return success status
- Handle errors

##### Step 6: Add getProjectMembers() Method
- Method signature: `getProjectMembers(projectId: string)`
- Make GET request to `/projects/:projectId/members`
- Return array of ProjectMember
- Handle errors

##### Step 7: Add getUserProjects() Method
- Method signature: `getUserProjects(userId: string)`
- Make GET request to `/users/:userId/projects`
- Return array of Project
- Handle errors

##### Step 8: Update Query Parameters
- Update any query parameters that use `campDate`
- Change to `startDateFrom` and `startDateTo` or similar
- Update filter methods accordingly

---

## 1.7 Update Project Store (Zustand)

### 1.7.1 Modify ProjectsStore

#### What to Do
Update Zustand store to handle new project fields and member management.

#### Where to Modify
**File Location**: `lims-frontend/src/store/packages.store.ts` or `projects.store.ts`

#### How to Do It

##### Step 1: Update Project State Type
- Update Project type in store
- Ensure it matches updated interface

##### Step 2: Update Actions
- Review all actions that use `campDate`
- Update to use `startDate` and `endDate`
- Add actions for member management:
  - `addMember(projectId, userId)`
  - `removeMember(projectId, userId)`
  - `fetchMembers(projectId)`

##### Step 3: Update Selectors
- Update any selectors that filter by `campDate`
- Update to use `startDate`/`endDate` range

---

## 1.8 Update Date Utilities

### 1.8.1 Create/Update Date Helper Functions

#### What to Do
Create utility functions for handling date ranges and formatting.

#### Where to Create/Modify
**File Location**: `lims-frontend/src/utils/date.utils.ts` or similar

#### How to Do It

##### Step 1: Create formatDateRange() Function
- Input: startDate, endDate (both nullable)
- Output: Formatted string
- Examples:
  - "Dec 10 - Dec 14, 2024" (both dates)
  - "Dec 10 - Ongoing" (endDate null)
  - "Dec 10, 2024" (same date)
- Use date-fns format function

##### Step 2: Create isDateRangeValid() Function
- Input: startDate, endDate
- Output: boolean
- Validation: endDate >= startDate
- Handle null endDate (always valid)

##### Step 3: Create getDateRangeDisplay() Function
- Input: startDate, endDate
- Output: Display object with:
  - formatted: string
  - isOngoing: boolean
  - duration: number (days)

##### Step 4: Update Existing Date Utilities
- Review existing date formatting functions
- Update to handle new date fields
- Ensure consistency across app

---

## 1.9 Update User Selection Component

### 1.9.1 Create/Update UserMultiSelect Component

#### What to Do
Create a reusable component for selecting multiple users, grouped by role.

#### Where to Create
**File Location**: `lims-frontend/src/components/common/UserMultiSelect/UserMultiSelect.tsx`

#### How to Do It

##### Step 1: Component Props
- `selectedUserIds`: string[] (required) - Currently selected users
- `onChange`: (userIds: string[]) => void (required) - Callback on selection change
- `excludeUserIds?: string[]` - Users to exclude from list
- `filterByRoles?: UserRole[]` - Filter users by roles
- `groupByRole?: boolean` - Group users by role
- `placeholder?: string` - Placeholder text

##### Step 2: Component Logic
- Fetch users from API (or receive as prop)
- Filter users:
  - Exclude already selected users
  - Filter by roles if provided
- Group by role if `groupByRole` is true
- Handle user selection:
  - Add/remove from selected list
  - Call `onChange` callback

##### Step 3: UI Design
- Use shadcn/ui components:
  - Popover or Dialog for dropdown
  - Checkbox for selection
  - Badge for selected users
- Show user name and email
- Show role badge
- Group by role with headers
- Search functionality

##### Step 4: Selected Users Display
- Show selected users as badges/chips
- Allow removing individual selections
- Show count: "X members selected"
- Clear all button

##### Step 5: Loading and Error States
- Show loading spinner while fetching users
- Show error message if fetch fails
- Show empty state if no users available

---

## 1.10 Update Navigation and Breadcrumbs

### 1.10.1 Update Project-Related Navigation

#### What to Do
Update navigation to reflect project changes and add team management links.

#### Where to Modify
**File Location**: `lims-frontend/src/components/layouts/Sidebar/Sidebar.tsx` or navigation component

#### How to Do It
- Review project-related menu items
- Ensure links work with updated routes
- Add "Team" section if needed
- Update active state detection

---

## 1.11 Error Handling

### 1.11.1 Add Error Handling for New Features

#### What to Do
Ensure proper error handling for all new functionality.

#### How to Do It

##### Step 1: API Error Handling
- Handle errors from:
  - Project creation/update with dates
  - Member add/remove operations
  - Member fetch operations
- Show user-friendly error messages
- Log errors for debugging

##### Step 2: Validation Error Handling
- Show validation errors for:
  - Date range validation
  - Required fields
  - Invalid user selections
- Display errors inline with form fields

##### Step 3: Permission Error Handling
- Handle cases where user doesn't have permission to:
  - Add/remove members
  - Edit project dates
- Show appropriate error messages
- Hide UI elements user can't access

---

## 1.12 Testing Requirements

### Component Tests

#### What to Test
- ProjectForm with new date fields
- ProjectMemberManager component
- UserMultiSelect component
- Date utility functions
- API service methods

#### Where to Create Tests
- `lims-frontend/src/components/projects/ProjectForm/ProjectForm.test.tsx`
- `lims-frontend/src/components/projects/ProjectMemberManager/ProjectMemberManager.test.tsx`
- `lims-frontend/src/utils/date.utils.test.ts`

#### How to Test
- Mock API calls
- Test form validation
- Test user interactions
- Test date formatting
- Test error scenarios

---

## 1.13 Verification Checklist

Before moving to Frontend Phase 2, verify:

- [ ] Project types updated
- [ ] ProjectForm updated with date range picker
- [ ] ProjectForm updated with team member selection
- [ ] ProjectMemberManager component created
- [ ] Project detail page shows dates correctly
- [ ] Project detail page shows team members
- [ ] Project list shows date ranges
- [ ] Project list shows member counts
- [ ] API service methods updated
- [ ] API service has member management methods
- [ ] Date utilities created/updated
- [ ] UserMultiSelect component created
- [ ] Form validation works
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Responsive design works
- [ ] Accessibility requirements met
- [ ] Component tests written
- [ ] Manual testing completed

---

## 1.14 Common Pitfalls to Avoid

1. **Date formatting inconsistencies** - Use centralized date utilities
2. **Not handling null endDate** - Show "Ongoing" appropriately
3. **Forgetting to update all components** - Check all project-related components
4. **Poor UX for member selection** - Make it easy to find and select users
5. **Not validating date range** - Ensure endDate >= startDate
6. **Missing loading states** - Show feedback during API calls
7. **Not handling permissions** - Hide/disable features user can't access

---

## 1.15 Next Steps

After completing Frontend Phase 1:
1. Test all new features thoroughly
2. Verify date handling works correctly
3. Test member management flow
4. Check responsive design
5. Verify accessibility
6. Proceed to Frontend Phase 2 only after all checklist items are complete


