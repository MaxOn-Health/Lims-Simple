# Frontend Phase 2: Project-Scoped Access Control UI

## Goal
Update frontend to filter and display data based on user's assigned projects. Users should only see patients, assignments, and results from their projects.

## Duration Estimate
3-4 days

## Prerequisites
- Backend Phase 2 completed
- Project-scoped API endpoints working
- Frontend Phase 1 completed
- Understanding of React context/hooks for user state

---

## 2.1 Update User Context/Store

### 2.1.1 Add User Projects to Auth Store

#### What to Do
Store user's assigned projects in the authentication store/context so it's available throughout the app.

#### Where to Modify
**File Location**: `lims-frontend/src/store/auth.store.ts`

#### How to Do It

##### Step 1: Add Projects to User State
- Add `projects: Project[]` to user state
- Or add `projectIds: string[]` for lighter state
- Initialize as empty array

##### Step 2: Fetch User Projects on Login
- After successful login:
  - Fetch user's projects from API
  - Store in auth state
  - Cache for session

##### Step 3: Add getCurrentUserProjects() Method
- Method to get current user's projects
- Return from auth store
- Use throughout app for filtering

##### Step 4: Add setUserProjects() Method
- Method to update user projects
- Call when projects change
- Update cache

##### Step 5: Handle SUPER_ADMIN
- If user is SUPER_ADMIN:
  - Option 1: Fetch all projects (if needed)
  - Option 2: Don't filter (show all data)
  - Document decision

---

## 2.2 Create Project Context Provider

### 2.2.1 Create ProjectContext

#### What to Do
Create a React context to manage current project selection and project-scoped data.

#### Where to Create
**File Location**: `lims-frontend/src/contexts/ProjectContext.tsx`

#### How to Do It

##### Step 1: Create Context
- Create React context for project state
- Include:
  - `selectedProjectId: string | null`
  - `userProjects: Project[]`
  - `setSelectedProject: (projectId: string | null) => void`

##### Step 2: Create Provider Component
- Wrap app or relevant sections
- Fetch user projects on mount
- Manage selected project state
- Provide context to children

##### Step 3: Create useProject Hook
- Custom hook: `useProject()`
- Returns project context values
- Use throughout app

##### Step 4: Handle Project Selection
- If user has one project: auto-select
- If user has multiple projects: allow selection
- If user has no projects: show message

---

## 2.3 Update Patient List Components

### 2.3.1 Modify Patient List Page

#### What to Do
Update patient list to filter by user's projects automatically.

#### Where to Modify
**File Location**: `lims-frontend/src/app/patients/page.tsx`

#### How to Do It

##### Step 1: Get User Projects
- Use auth store or ProjectContext
- Get current user's project IDs
- If SUPER_ADMIN: don't filter (or show all)

##### Step 2: Update API Call
- Pass projectIds to API query (if backend supports)
- Or backend auto-filters based on user
- Handle empty project list (show message)

##### Step 3: Add Project Filter (Optional)
- If user has multiple projects:
  - Add project filter dropdown
  - Allow filtering by specific project
  - Show "All Projects" option
- If user has one project:
  - Hide filter (auto-applied)
  - Show project name as context

##### Step 4: Update Patient Cards/Table
- Show project name/badge on each patient
- Link to project detail page
- Color code by project (optional)

##### Step 5: Handle Empty State
- If no patients in user's projects:
  - Show message: "No patients in your assigned projects"
  - Show link to projects page
- If user has no projects:
  - Show message: "You are not assigned to any projects"
  - Show contact admin message

---

### 2.3.2 Update Patient Registration Form

#### What to Do
Ensure patient registration respects project assignment.

#### Where to Modify
**File Location**: `lims-frontend/src/app/patients/new/page.tsx` or form component

#### How to Do It

##### Step 1: Add Project Selection
- If user has multiple projects:
  - Add project dropdown (required)
  - Pre-select if only one project
- If user has one project:
  - Auto-select project
  - Show project name (read-only)
- If user has no projects:
  - Disable form
  - Show error message

##### Step 2: Update Form Validation
- Ensure projectId is set
- Validate user has access to selected project
- Show validation error if no project selected

##### Step 3: Update Form Submission
- Include projectId in submission
- Handle API errors (project access denied)
- Show success message with project context

---

## 2.4 Update Assignment Components

### 2.4.1 Modify Assignment List Page

#### What to Do
Update assignment list to show only assignments from user's projects.

#### Where to Modify
**File Location**: `lims-frontend/src/app/assignments/page.tsx`

#### How to Do It

##### Step 1: Filter by Projects
- Get user's project IDs
- Filter assignments by patient's project
- Backend should handle this, but verify

##### Step 2: Add Project Context
- Show project name/badge for each assignment
- Group assignments by project (optional)
- Add project filter dropdown

##### Step 3: Update Assignment Cards
- Display project information
- Link to project detail
- Show project-specific status

##### Step 4: Handle Empty State
- Show message if no assignments in projects
- Provide helpful next steps

---

### 2.4.2 Modify My Assignments Page

#### What to Do
Update admin's "My Assignments" to show only assignments from their projects.

#### Where to Modify
**File Location**: `lims-frontend/src/app/assignments/my-assignments/page.tsx`

#### How to Do It

##### Step 1: Apply Project Filter
- Get admin's project IDs
- Filter assignments automatically
- Backend should handle, verify

##### Step 2: Show Project Context
- Display project name for each assignment
- Group by project (optional)
- Add project filter tabs

##### Step 3: Update Statistics
- Calculate stats per project
- Show project-wise breakdown
- Total assignments across all projects

---

### 2.4.3 Modify Auto-Assignment Page

#### What to Do
Ensure auto-assignment only works within user's projects.

#### Where to Modify
**File Location**: `lims-frontend/src/app/assignments/auto-assign/page.tsx`

#### How to Do It

##### Step 1: Filter Patients
- Only show patients from user's projects
- Validate project access before assignment

##### Step 2: Show Project Context
- Display project name for selected patient
- Warn if patient is in different project
- Prevent cross-project assignment (unless SUPER_ADMIN)

##### Step 3: Update Assignment Preview
- Show project context in preview
- Verify all assignments are within projects

---

## 2.5 Update Doctor Dashboard

### 2.5.1 Modify Doctor Dashboard

#### What to Do
Update doctor dashboard to show only patients from doctor's assigned projects.

#### Where to Modify
**File Location**: `lims-frontend/src/app/doctor/dashboard/page.tsx` or component

#### How to Do It

##### Step 1: Filter Patients by Projects
- Get doctor's project IDs
- Filter patients automatically
- Backend should handle, verify API call

##### Step 2: Add Project Selector
- If doctor has multiple projects:
  - Add project dropdown at top
  - Filter patients by selected project
  - Show "All Projects" option
- If doctor has one project:
  - Show project name as header
  - No selector needed

##### Step 3: Update Patient Cards
- Show project name/badge
- Group patients by project (optional)
- Show project-specific statistics

##### Step 4: Update Statistics Cards
- Calculate stats per project
- Show:
  - Total patients (in projects)
  - Pending reviews (in projects)
  - Completed reviews (in projects)
- Update when project filter changes

##### Step 5: Handle Empty State
- If no patients in projects:
  - Show message
  - Show link to projects
- If no projects assigned:
  - Show message: "You are not assigned to any projects"
  - Show contact admin message

---

### 2.5.2 Modify Patient Results View

#### What to Do
Ensure patient results view respects project access.

#### Where to Modify
**File Location**: `lims-frontend/src/app/doctor/patients/[patientId]/review/page.tsx`

#### How to Do It

##### Step 1: Verify Project Access
- Check if patient is in doctor's projects
- If not, show access denied message
- Redirect or show error

##### Step 2: Show Project Context
- Display project name/badge
- Show project dates
- Link to project detail

##### Step 3: Update API Calls
- Ensure API calls include project context
- Handle project access errors

---

## 2.6 Update Results Components

### 2.6.1 Modify Results List Page

#### What to Do
Update results list to filter by user's projects.

#### Where to Modify
**File Location**: `lims-frontend/src/app/results/page.tsx`

#### How to Do It

##### Step 1: Apply Project Filter
- Get user's project IDs
- Filter results by patient's project
- Backend should handle, verify

##### Step 2: Show Project Context
- Display project name for each result
- Add project filter dropdown
- Group results by project (optional)

##### Step 3: Update Result Cards
- Show project badge
- Link to project detail
- Show project-specific information

---

### 2.6.2 Modify Result Entry Form

#### What to Do
Ensure result entry respects project assignment.

#### Where to Modify
**File Location**: `lims-frontend/src/app/results/entry/[assignmentId]/page.tsx`

#### How to Do It

##### Step 1: Verify Assignment Access
- Check if assignment's patient is in user's projects
- If not, show access denied
- Prevent submission

##### Step 2: Show Project Context
- Display project name
- Show project information
- Provide context for assignment

---

## 2.7 Update Blood Samples Components

### 2.7.1 Modify Blood Samples List

#### What to Do
Update blood samples list to filter by user's projects.

#### Where to Modify
**File Location**: `lims-frontend/src/app/blood-samples/page.tsx`

#### How to Do It

##### Step 1: Apply Project Filter
- Get user's project IDs
- Filter samples by patient's project
- Backend should handle, verify

##### Step 2: Show Project Context
- Display project name for each sample
- Add project filter dropdown
- Group samples by project

##### Step 3: Update Sample Cards
- Show project badge
- Link to project detail
- Show project-specific status

---

### 2.7.2 Modify Sample Registration

#### What to Do
Ensure sample registration respects project assignment.

#### Where to Modify
**File Location**: `lims-frontend/src/app/blood-samples/register/page.tsx`

#### How to Do It

##### Step 1: Filter Patients
- Only show patients from user's projects
- Validate project access

##### Step 2: Show Project Context
- Display project name for selected patient
- Verify project access before registration

---

## 2.8 Update Reports Components

### 2.8.1 Modify Reports List Page

#### What to Do
Update reports list to filter by user's projects.

#### Where to Modify
**File Location**: `lims-frontend/src/app/reports/page.tsx`

#### How to Do It

##### Step 1: Apply Project Filter
- Get user's project IDs
- Filter reports by patient's project
- Backend should handle, verify

##### Step 2: Show Project Context
- Display project name for each report
- Add project filter dropdown
- Group reports by project

##### Step 3: Update Report Cards
- Show project badge
- Link to project detail
- Show project-specific information

---

## 2.9 Update Dashboard Components

### 2.9.1 Modify Role-Based Dashboards

#### What to Do
Update all role-based dashboards to show project-scoped statistics.

#### Where to Modify
**File Locations**:
- `lims-frontend/src/app/dashboard/page.tsx`
- Role-specific dashboard components

#### How to Do It

##### Step 1: Receptionist Dashboard
- Show statistics for user's projects only
- Patient count per project
- Pending assignments per project
- Recent registrations from projects

##### Step 2: Test Technician Dashboard
- Show assignments from technician's projects only
- Statistics per project
- Recent activity from projects

##### Step 3: Lab Technician Dashboard
- Show samples from technician's projects only
- Statistics per project
- Recent activity from projects

##### Step 4: Doctor Dashboard
- Already updated in section 2.5
- Ensure consistency

##### Step 5: SUPER_ADMIN Dashboard
- Show all projects or allow selection
- Provide project filter
- Show cross-project statistics

---

## 2.10 Create Project Selector Component

### 2.10.1 Create ProjectSelector Component

#### What to Do
Create a reusable component for selecting/filtering by project.

#### Where to Create
**File Location**: `lims-frontend/src/components/common/ProjectSelector/ProjectSelector.tsx`

#### How to Do It

##### Step 1: Component Props
- `selectedProjectId?: string | null` - Currently selected project
- `onSelect: (projectId: string | null) => void` - Callback on selection
- `userProjects: Project[]` - Available projects
- `showAllOption?: boolean` - Show "All Projects" option
- `placeholder?: string` - Placeholder text
- `disabled?: boolean` - Disable selection

##### Step 2: Component Logic
- Display dropdown/select with projects
- Show project name and dates
- Show "All Projects" option if enabled
- Handle selection change
- Call `onSelect` callback

##### Step 3: UI Design
- Use shadcn/ui Select component
- Show project name prominently
- Show date range below name
- Show member count (optional)
- Highlight selected project

##### Step 4: Auto-Select Behavior
- If only one project: auto-select and disable
- If multiple projects: allow selection
- If no projects: show message

##### Step 5: Empty State
- Show message if no projects
- Provide helpful information

---

## 2.11 Update Search Functionality

### 2.11.1 Modify Global Search

#### What to Do
Update global search to respect project scope.

#### Where to Modify
**File Location**: `lims-frontend/src/hooks/useGlobalSearch/useGlobalSearch.ts` or search component

#### How to Do It

##### Step 1: Apply Project Filter
- Get user's project IDs
- Include in search queries
- Backend should handle, verify

##### Step 2: Show Project Context in Results
- Display project name for each result
- Group results by project
- Highlight project in results

##### Step 3: Update Search Store
- Include project filtering in search state
- Update search results to show project context

---

## 2.12 Update Navigation and Breadcrumbs

### 2.12.1 Add Project Context to Navigation

#### What to Do
Show current project context in navigation/breadcrumbs.

#### Where to Modify
**File Location**: `lims-frontend/src/components/layouts/Header/Header.tsx` or breadcrumb component

#### How to Do It

##### Step 1: Show Current Project
- Display selected project name in header
- Show project selector if multiple projects
- Link to project detail

##### Step 2: Update Breadcrumbs
- Include project name in breadcrumbs
- Show: Home > Projects > [Project Name] > Current Page
- Make project name clickable

##### Step 3: Update Sidebar
- Highlight current project context
- Show project-specific navigation (optional)

---

## 2.13 Handle Permission Errors

### 2.13.1 Create Access Denied Component

#### What to Do
Create a component to show when user doesn't have access to a resource.

#### Where to Create
**File Location**: `lims-frontend/src/components/common/AccessDenied/AccessDenied.tsx`

#### How to Do It

##### Step 1: Component Design
- Show error message
- Explain why access is denied
- Provide helpful actions:
  - Link to projects page
  - Contact admin message
  - Go back button

##### Step 2: Use Cases
- Patient not in user's projects
- Assignment not accessible
- Project not assigned to user

##### Step 3: Styling
- Use Error state styling
- Clear, user-friendly message
- Actionable buttons

---

## 2.14 Update API Services

### 2.14.1 Modify All API Services

#### What to Do
Ensure all API services handle project filtering correctly.

#### How to Do It

##### Step 1: Review All Services
- Patients service
- Assignments service
- Results service
- Blood samples service
- Reports service
- Doctor reviews service

##### Step 2: Update Query Parameters
- Add projectId parameter where needed
- Ensure backend handles filtering
- Document which endpoints support project filtering

##### Step 3: Handle API Errors
- Handle 403 Forbidden (project access denied)
- Show user-friendly error messages
- Provide recovery actions

---

## 2.15 Testing Requirements

### Component Tests

#### What to Test
- Project filtering in lists
- Project selector component
- Access denied scenarios
- Project context in navigation
- Empty states

#### Where to Create Tests
- Component test files
- Integration test files

#### How to Test
- Mock user projects
- Test filtering logic
- Test access denial
- Test project selection

---

## 2.16 Verification Checklist

Before moving to Frontend Phase 3, verify:

- [ ] User projects stored in auth store
- [ ] ProjectContext created and working
- [ ] Patient list filters by projects
- [ ] Assignment list filters by projects
- [ ] Doctor dashboard filters by projects
- [ ] Results list filters by projects
- [ ] Blood samples list filters by projects
- [ ] Reports list filters by projects
- [ ] All dashboards show project-scoped stats
- [ ] Project selector component created
- [ ] Navigation shows project context
- [ ] Access denied component created
- [ ] Empty states show helpful messages
- [ ] API services handle project filtering
- [ ] Error handling implemented
- [ ] SUPER_ADMIN behavior works correctly
- [ ] Responsive design works
- [ ] Accessibility requirements met
- [ ] Component tests written
- [ ] Manual testing completed

---

## 2.17 Common Pitfalls to Avoid

1. **Not handling empty project list** - Always show helpful message
2. **Forgetting SUPER_ADMIN case** - Document and handle appropriately
3. **Not showing project context** - Users should know which project they're viewing
4. **Poor empty states** - Provide actionable next steps
5. **Not handling API errors** - Show clear error messages
6. **Performance issues** - Don't fetch projects on every render
7. **Missing project context** - Show project name consistently

---

## 2.18 Next Steps

After completing Frontend Phase 2:
1. Test project filtering thoroughly
2. Verify access control works
3. Test with multiple projects
4. Test SUPER_ADMIN access
5. Verify empty states
6. Proceed to Frontend Phase 3 only after all checklist items are complete


