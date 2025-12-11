# Phase 2: Project-Scoped Access Control

## Goal
Filter all data queries by the current user's assigned projects. Ensure users only see data (patients, assignments, results) from projects they are members of.

## Duration Estimate
2-3 days

## Prerequisites
- Phase 1 completed successfully
- ProjectMember entity exists and is functional
- Database indexes are in place
- Understanding of NestJS guards and decorators

---

## 2.1 Backend: Helper Service for Project Access

### 2.1.1 Create ProjectAccessService

#### What to Do
Create a service that provides helper methods for checking and retrieving user project access.

#### Where to Create
**File Location**: `lims-backend/src/common/services/project-access.service.ts`

#### How to Do It

##### Step 1: Create Service Class
- Use `@Injectable()` decorator
- Inject ProjectMember repository
- Inject User repository (for SUPER_ADMIN check)

##### Step 2: Implement getUserProjectIds() Method
- Method signature: `getUserProjectIds(userId: string, userRole: UserRole): Promise<string[]>`
- If user is SUPER_ADMIN, return empty array (or all project IDs - document decision)
- Otherwise, query ProjectMember where userId matches
- Return array of project IDs
- Cache result if needed (optional, for performance)

##### Step 3: Implement isUserInProject() Method
- Method signature: `isUserInProject(userId: string, projectId: string): Promise<boolean>`
- Query ProjectMember for matching userId and projectId
- Return boolean
- SUPER_ADMIN should return true (or handle separately)

##### Step 4: Implement canAccessProject() Method
- Method signature: `canAccessProject(userId: string, projectId: string, userRole: UserRole): Promise<boolean>`
- Check if user is SUPER_ADMIN → return true
- Otherwise check ProjectMember
- Return boolean

##### Step 5: Add Caching Strategy (Optional but Recommended)
- Cache user's project IDs in memory (Map<string, string[]>)
- Invalidate cache when ProjectMember is added/removed
- Set TTL for cache entries (e.g., 5 minutes)
- Document caching behavior

---

## 2.2 Backend: Scoped Queries - Patients Module

### 2.2.1 Modify PatientsService

#### What to Do
Update patient queries to filter by project scope based on current user's assigned projects.

#### Where to Modify
**File Location**: `lims-backend/src/modules/patients/patients.service.ts`

#### How to Do It

##### Step 1: Inject Dependencies
- Inject ProjectAccessService (or ProjectMember repository)
- Inject User repository if needed

##### Step 2: Update findAll() Method
- Current signature: `findAll(queryDto: QueryPatientsDto, currentUserId?: string)`
- Add logic:
  - Get current user's role
  - If SUPER_ADMIN: no project filtering (or optional filter)
  - Otherwise: Get user's project IDs via ProjectAccessService
  - Filter patients where `projectId IN (userProjectIds)`
  - If no projects assigned, return empty array
- Update query builder to include project filter
- Maintain existing search and pagination logic

##### Step 3: Add getPatientsByProject() Method
- Method signature: `getPatientsByProject(projectId: string, queryDto?: QueryPatientsDto)`
- Validate user has access to project (use ProjectAccessService)
- Query patients where projectId matches
- Apply search and pagination filters
- Return paginated results

##### Step 4: Update findOne() Method
- Add project access check
- If user is not SUPER_ADMIN:
  - Get patient's projectId
  - Verify user has access to that project
  - Throw ForbiddenException if no access
- Keep existing logic for patient lookup

##### Step 5: Update register() Method
- Ensure projectId is set when creating patient
- Validate project exists
- Validate user has access to project (if not SUPER_ADMIN)
- Keep existing registration logic

##### Step 6: Update Other Query Methods
- Review all methods that query patients
- Add project filtering where appropriate
- Methods to check:
  - `findByPatientId()`
  - `searchPatients()`
  - Any other query methods

##### Step 7: Performance Optimization
- Ensure projectId filter uses index
- Use IN clause efficiently
- Consider query optimization for users with many projects

---

## 2.3 Backend: Scoped Queries - Assignments Module

### 2.3.1 Modify AssignmentsService

#### What to Do
Update assignment queries and creation to respect project scope.

#### Where to Modify
**File Location**: `lims-backend/src/modules/assignments/assignments.service.ts`

#### How to Do It

##### Step 1: Inject Dependencies
- Inject ProjectAccessService
- Inject Patient repository (to get patient's projectId)

##### Step 2: Update autoAssign() Method
- Current signature: `autoAssign(patientId: string, assignedByUserId: string)`
- Get patient's projectId
- Verify assignedBy user has access to patient's project
- When calling AdminSelectionService.findAvailableAdmin():
  - Pass projectId parameter (will be implemented in Phase 3)
  - For now, document that this will be enhanced
- Keep existing assignment creation logic

##### Step 3: Update manualAssign() Method
- Get patient's projectId
- Verify assignedBy user has access to patient's project
- If adminId provided, verify admin is in same project
- Keep existing validation logic

##### Step 4: Update findAll() or getAssignments() Method
- Add project filtering:
  - Get user's project IDs
  - Join with Patient table
  - Filter by patient.projectId IN (userProjectIds)
- Maintain existing filters (status, patientId, etc.)
- SUPER_ADMIN sees all assignments

##### Step 5: Update getMyAssignments() Method
- Current signature: `getMyAssignments(adminId: string, queryDto: QueryAssignmentsDto)`
- Get admin's project IDs
- Filter assignments where:
  - Assignment belongs to admin
  - Patient's projectId IN (adminProjectIds)
- This ensures admin only sees assignments from their projects

##### Step 6: Update Other Query Methods
- Review all methods that query assignments
- Add project filtering where needed
- Methods to check:
  - `getAssignmentsByPatient()`
  - `getAssignmentById()`
  - Any other query methods

---

## 2.4 Backend: Scoped Queries - AdminSelectionService

### 2.4.1 Modify AdminSelectionService

#### What to Do
Update the service to filter technicians by project when selecting available admin.

#### Where to Modify
**File Location**: `lims-backend/src/modules/assignments/services/admin-selection.service.ts`

#### How to Do It

##### Step 1: Inject Dependencies
- Inject ProjectMember repository
- Keep existing User and Assignment repositories

##### Step 2: Update findAvailableAdmin() Method
- Current signature: `findAvailableAdmin(adminRole: string): Promise<User | null>`
- New signature: `findAvailableAdmin(adminRole: string, projectId?: string): Promise<User | null>`
- If projectId provided:
  - Query ProjectMember to get user IDs in project
  - Filter User query to only include users in project
  - Rest of logic remains same (least assignments, oldest on tie)
- If projectId not provided:
  - Use existing global logic (backward compatibility)
- Return null if no technicians in project

##### Step 3: Add Helper Method (Optional)
- `getTechniciansInProject(projectId: string, adminRole: string): Promise<User[]>`
- Returns all technicians of given type in project
- Can be used by frontend for technician selection

##### Step 4: Update Tests
- Update existing tests to handle projectId parameter
- Add tests for project-scoped selection
- Test case: no technicians in project

---

## 2.5 Backend: Scoped Queries - Doctor Reviews Module

### 2.5.1 Modify DoctorReviewsService

#### What to Do
Update doctor review queries to only show patients from doctor's assigned projects.

#### Where to Modify
**File Location**: `lims-backend/src/modules/doctor-reviews/doctor-reviews.service.ts`

#### How to Do It

##### Step 1: Inject Dependencies
- Inject ProjectAccessService
- Keep existing repositories

##### Step 2: Update findPatientsForReview() Method
- Current signature: `findPatientsForReview(doctorId: string, queryDto: QueryPatientsDto)`
- Get doctor's project IDs via ProjectAccessService
- Update patient query to filter by projectId:
  - Join with Patient table
  - Add WHERE clause: `patient.projectId IN (doctorProjectIds)`
- If doctor has no projects, return empty array
- Keep existing logic for:
  - Checking all tests are SUBMITTED
  - Filtering by review status
  - Search functionality
  - Pagination

##### Step 3: Update getPatientResults() Method
- Add project access check
- Verify patient's projectId is in doctor's projects
- Throw ForbiddenException if no access
- Keep existing result aggregation logic

##### Step 4: Update createReview() Method
- Add project access check before creating review
- Verify patient's projectId is in doctor's projects
- Keep existing review creation logic

##### Step 5: Update signReport() Method
- Add project access check
- Verify patient's projectId is in doctor's projects
- Keep existing signing logic

---

## 2.6 Backend: Scoped Queries - Results Module

### 2.6.1 Modify ResultsService

#### What to Do
Update result queries to respect project scope.

#### Where to Modify
**File Location**: `lims-backend/src/modules/results/results.service.ts`

#### How to Do It

##### Step 1: Inject Dependencies
- Inject ProjectAccessService
- Inject Patient repository (to get projectId)

##### Step 2: Update getResultsByPatient() Method
- Add project access check
- Get patient's projectId
- Verify current user has access to patient's project
- Keep existing result retrieval logic

##### Step 3: Update submitResult() Method
- Get assignment's patient
- Get patient's projectId
- Verify submitting user has access to project
- Keep existing submission logic

##### Step 4: Update Other Query Methods
- Review all methods that query results
- Add project filtering where appropriate
- Methods to check:
  - `getResultByAssignment()`
  - `getAllResults()`
  - Any other query methods

---

## 2.7 Backend: Scoped Queries - Blood Samples Module

### 2.7.1 Modify BloodSamplesService

#### What to Do
Update blood sample queries to respect project scope.

#### Where to Modify
**File Location**: `lims-backend/src/modules/blood-samples/blood-samples.service.ts`

#### How to Do It

##### Step 1: Inject Dependencies
- Inject ProjectAccessService
- Inject Patient repository

##### Step 2: Update registerSample() Method
- Get patient's projectId
- Verify registering user has access to project
- Keep existing sample registration logic

##### Step 3: Update accessSample() Method
- Get sample's patient
- Get patient's projectId
- Verify accessing user has access to project
- Keep existing passcode verification logic

##### Step 4: Update getMySamples() Method
- Get user's project IDs
- Filter samples where patient.projectId IN (userProjectIds)
- Keep existing status filtering

##### Step 5: Update Other Query Methods
- Review all methods that query blood samples
- Add project filtering where appropriate

---

## 2.8 Backend: Scoped Queries - Reports Module

### 2.8.1 Modify ReportsService

#### What to Do
Update report queries to respect project scope.

#### Where to Modify
**File Location**: `lims-backend/src/modules/reports/reports.service.ts`

#### How to Do It

##### Step 1: Inject Dependencies
- Inject ProjectAccessService
- Inject Patient repository

##### Step 2: Update getReportsByPatient() Method
- Add project access check
- Get patient's projectId
- Verify current user has access to patient's project
- Keep existing report retrieval logic

##### Step 3: Update generateReport() Method
- Get patient's projectId
- Verify generating user has access to project
- Keep existing report generation logic

##### Step 4: Update getAllReports() Method
- Add project filtering:
  - Get user's project IDs
  - Join with Patient table
  - Filter by patient.projectId IN (userProjectIds)
- Maintain existing filters
- SUPER_ADMIN sees all reports

---

## 2.9 Backend: Create Project Access Guard

### 2.9.1 Create ProjectAccessGuard

#### What to Do
Create a guard that validates user has access to a project before allowing access to project-specific endpoints.

#### Where to Create
**File Location**: `lims-backend/src/common/guards/project-access.guard.ts`

#### How to Do It

##### Step 1: Create Guard Class
- Implement `CanActivate` interface
- Inject ProjectAccessService
- Inject Reflector for metadata

##### Step 2: Create @ProjectAccess() Decorator
- Location: `lims-backend/src/common/decorators/project-access.decorator.ts`
- Use `SetMetadata()` to mark routes that need project access check
- Accept optional parameter for projectId source (param, query, body)

##### Step 3: Implement canActivate() Method
- Get current user from request (use existing @CurrentUser() pattern)
- Extract projectId from request (param, query, or body based on decorator)
- Call ProjectAccessService.canAccessProject()
- Return true if access granted, false otherwise
- SUPER_ADMIN always has access

##### Step 4: Handle Different ProjectId Sources
- Support projectId from:
  - Route parameter (`:projectId`)
  - Query parameter (`?projectId=...`)
  - Request body (`{ projectId: ... }`)
- Document which source to use for each endpoint

##### Step 5: Error Handling
- Throw ForbiddenException if access denied
- Provide clear error message
- Log access denials for security

##### Step 6: Usage Example
- Apply guard to endpoints like:
  - `GET /projects/:projectId/members`
  - `GET /patients/by-project/:projectId`
  - Any endpoint that accesses project-specific data

---

## 2.10 Backend: Update DTOs for Project Filtering

### 2.10.1 Modify QueryPatientsDto

#### What to Do
Add optional projectId filter to patient queries.

#### Where to Modify
**File Location**: `lims-backend/src/modules/patients/dto/query-patients.dto.ts`

#### How to Do It
- Add `projectId?: string` property
- Add `@IsOptional()` decorator
- Add `@IsUUID()` decorator
- Add `@ApiProperty` for Swagger
- Document that this is optional and will be auto-filtered by user's projects if not provided

---

### 2.10.2 Modify QueryAssignmentsDto

#### What to Do
Add optional projectId filter to assignment queries.

#### Where to Modify
**File Location**: `lims-backend/src/modules/assignments/dto/query-assignments.dto.ts`

#### How to Do It
- Add `projectId?: string` property
- Same decorators as above
- Document usage

---

### 2.10.3 Modify QueryPatientsDto (Doctor Reviews)

#### What to Do
Add projectId filter to doctor review patient queries.

#### Where to Modify
**File Location**: `lims-backend/src/modules/doctor-reviews/dto/query-patients.dto.ts`

#### How to Do It
- Add `projectId?: string` property
- Document that if provided, filters by that project
- If not provided, shows all patients from doctor's projects

---

## 2.11 Backend: Update Controllers

### 2.11.1 Update PatientsController

#### What to Do
Apply project access checks to patient endpoints.

#### Where to Modify
**File Location**: `lims-backend/src/modules/patients/patients.controller.ts`

#### How to Do It
- Update `findAll()` endpoint to use scoped service method
- Add `@ProjectAccess()` guard to project-specific endpoints
- Update Swagger documentation
- Ensure @CurrentUser() decorator is used to get current user

---

### 2.11.2 Update AssignmentsController

#### What to Do
Apply project access checks to assignment endpoints.

#### Where to Modify
**File Location**: `lims-backend/src/modules/assignments/assignments.controller.ts`

#### How to Do It
- Update endpoints to use scoped service methods
- Add project access validation where needed
- Update Swagger documentation

---

### 2.11.3 Update DoctorReviewsController

#### What to Do
Apply project access checks to doctor review endpoints.

#### Where to Modify
**File Location**: `lims-backend/src/modules/doctor-reviews/doctor-reviews.controller.ts`

#### How to Do It
- Update `getPatientsForReview()` to accept projectId query param
- Add project access checks to all endpoints
- Update Swagger documentation

---

## 2.12 Performance Optimization

### 2.12.1 Database Indexes

#### What to Do
Ensure all necessary indexes exist for project filtering queries.

#### Where to Verify
- Check migration files
- Verify indexes on:
  - `patients.project_id`
  - `project_members.user_id`
  - `project_members.project_id`

#### How to Verify
- Run EXPLAIN ANALYZE on sample queries
- Ensure indexes are being used
- Add indexes if missing

---

### 2.12.2 Query Optimization

#### What to Do
Optimize queries that join with ProjectMember.

#### How to Do It
- Use EXISTS instead of IN for large project lists
- Consider materialized views for complex queries
- Use query builder efficiently
- Avoid N+1 queries

---

### 2.12.3 Caching Strategy

#### What to Do
Implement caching for user project IDs.

#### How to Do It
- Cache in ProjectAccessService
- Invalidate cache when ProjectMember changes
- Set appropriate TTL
- Document cache behavior

---

## 2.13 Testing Requirements

### Unit Tests

#### What to Test
- ProjectAccessService methods
- Scoped query methods in all services
- ProjectAccessGuard
- Edge cases (no projects, SUPER_ADMIN, etc.)

#### Where to Create Tests
- `lims-backend/src/common/services/project-access.service.spec.ts`
- Update existing service spec files
- `lims-backend/src/common/guards/project-access.guard.spec.ts`

#### How to Test
- Mock repositories
- Test with different user roles
- Test with users having 0, 1, and multiple projects
- Test SUPER_ADMIN behavior
- Test access denial scenarios

---

### Integration Tests

#### What to Test
- End-to-end project scoping
- Multiple users accessing same/different projects
- Data isolation between projects

#### How to Test
- Create test data with multiple projects
- Create users assigned to different projects
- Verify users only see their project's data
- Test SUPER_ADMIN sees all data

---

## 2.14 Verification Checklist

Before moving to Phase 3, verify:

- [ ] ProjectAccessService created and tested
- [ ] PatientsService filters by project
- [ ] AssignmentsService filters by project
- [ ] AdminSelectionService accepts projectId parameter
- [ ] DoctorReviewsService filters by project
- [ ] ResultsService filters by project
- [ ] BloodSamplesService filters by project
- [ ] ReportsService filters by project
- [ ] ProjectAccessGuard created and working
- [ ] @ProjectAccess() decorator created
- [ ] All DTOs updated with projectId filters
- [ ] All controllers updated
- [ ] Database indexes verified
- [ ] Query performance acceptable
- [ ] Caching implemented (if needed)
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] SUPER_ADMIN behavior documented and tested
- [ ] Error handling for access denial works
- [ ] Swagger documentation updated

---

## 2.15 Common Pitfalls to Avoid

1. **Forgetting SUPER_ADMIN exception** - SUPER_ADMIN should see all data or have option to
2. **Not handling empty project list** - Users with no projects should see empty results, not error
3. **Performance issues** - Always use indexes, avoid N+1 queries
4. **Missing projectId in queries** - Ensure all patient-related queries include project filter
5. **Not testing edge cases** - Test with 0 projects, 1 project, many projects
6. **Cache invalidation** - If caching, ensure cache is invalidated when ProjectMember changes
7. **Breaking existing functionality** - Ensure backward compatibility where possible

---

## 2.16 Next Steps

After completing Phase 2:
1. Test thoroughly with multiple projects and users
2. Verify performance is acceptable
3. Review security implications
4. Document SUPER_ADMIN behavior decision
5. Proceed to Phase 3 only after all checklist items are complete


