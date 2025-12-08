# Phase 1: Database & Backend Foundation

## Goal
Create the ProjectMember entity and modify the Project entity for multi-day support. Establish the foundation for project-based team management.

## Duration Estimate
3-4 days

## Prerequisites
- Backend development environment set up
- Database access and migration tools ready
- Understanding of TypeORM entities and migrations

---

## 1.1 Database Migration

### What to Do
Create a new migration file that:
1. Creates the `project_members` table
2. Renames `camp_date` column to `start_date` in `projects` table
3. Adds `end_date` column to `projects` table
4. Adds necessary indexes for performance

### Where to Create
**File Location**: `lims-backend/src/database/migrations/[timestamp]-CreateProjectMembersAndUpdateProjects.ts`

### How to Do It

#### Step 1: Generate Migration File
- Use TypeORM migration generator
- Name should follow existing pattern: `[timestamp]-CreateProjectMembersAndUpdateProjects.ts`
- Timestamp should be sequential after the last migration

#### Step 2: Create project_members Table
- Table name: `project_members`
- Columns:
  - `id`: UUID, Primary Key, auto-generated
  - `project_id`: UUID, Foreign Key → `projects.id`, NOT NULL
  - `user_id`: UUID, Foreign Key → `users.id`, NOT NULL
  - `role_in_project`: VARCHAR(50), nullable (for future use: LEAD, MEMBER)
  - `created_at`: TIMESTAMP, default CURRENT_TIMESTAMP
  - `updated_at`: TIMESTAMP, default CURRENT_TIMESTAMP, on update CURRENT_TIMESTAMP
- Unique Constraint: (`project_id`, `user_id`) - prevents duplicate memberships
- Foreign Key Constraints:
  - `project_id` → `projects.id` ON DELETE CASCADE
  - `user_id` → `users.id` ON DELETE CASCADE

#### Step 3: Add Indexes
- Index on `project_members.project_id` for fast project lookups
- Index on `project_members.user_id` for fast user lookups
- Composite index on (`project_id`, `user_id`) for unique constraint

#### Step 4: Rename camp_date Column
- Rename `camp_date` to `start_date` in `projects` table
- Keep data intact during rename
- Update column type if needed (should remain DATE or TIMESTAMP)

#### Step 5: Add end_date Column
- Column name: `end_date`
- Type: DATE or TIMESTAMP, nullable
- Default: NULL
- Allow NULL to support ongoing projects

#### Step 6: Data Migration for Orphan Patients
- Create a "Default Project" if it doesn't exist
  - Name: "Default Project" or "Unassigned"
  - Status: ACTIVE
  - Start date: Current date
  - End date: NULL (ongoing)
- Assign all patients with `project_id = NULL` to this Default Project
- Log the count of migrated patients for verification

### Migration Rollback Strategy
- Document how to revert if migration fails
- Ensure data backup before running migration
- Test migration on development database first

---

## 1.2 Backend Entity Files

### 1.2.1 Create ProjectMember Entity

#### What to Do
Create a new entity file that represents the many-to-many relationship between Projects and Users.

#### Where to Create
**File Location**: `lims-backend/src/modules/projects/entities/project-member.entity.ts`

#### How to Do It

##### Entity Structure
- Import necessary TypeORM decorators
- Import Project entity from `../project.entity.ts`
- Import User entity from `../../users/entities/user.entity.ts`
- Create class `ProjectMember` decorated with `@Entity('project_members')`

##### Columns to Define
- `id`: UUID, PrimaryGeneratedColumn
- `projectId`: UUID, Column with name `project_id`, Index
- `userId`: UUID, Column with name `user_id`, Index
- `roleInProject`: String, nullable, Column with name `role_in_project`
- `createdAt`: CreateDateColumn with name `created_at`
- `updatedAt`: UpdateDateColumn with name `updated_at`

##### Relationships
- `@ManyToOne(() => Project, { onDelete: 'CASCADE' })` → `project`
- `@ManyToOne(() => User, { onDelete: 'CASCADE' })` → `user`
- Use `@JoinColumn` for both relationships

##### Unique Constraint
- Add `@Unique(['projectId', 'userId'])` at class level

##### Optional: RoleInProject Enum
- If implementing role hierarchy, create enum:
  - Location: `lims-backend/src/modules/projects/constants/role-in-project.enum.ts`
  - Values: `LEAD = 'LEAD'`, `MEMBER = 'MEMBER'`
- Update `roleInProject` column type to use this enum

---

### 1.2.2 Modify Project Entity

#### What to Do
Update the existing Project entity to:
1. Rename `campDate` to `startDate`
2. Add `endDate` field
3. Add relationship to ProjectMember

#### Where to Modify
**File Location**: `lims-backend/src/modules/projects/entities/project.entity.ts`

#### How to Do It

##### Step 1: Rename campDate Field
- Find `campDate` property
- Rename to `startDate`
- Update column name to `start_date` if needed
- Keep same type (Date | null)

##### Step 2: Add endDate Field
- Add new property: `endDate: Date | null`
- Column name: `end_date`
- Type: Date, nullable
- No default value

##### Step 3: Add ProjectMember Relationship
- Import ProjectMember entity
- Add `@OneToMany(() => ProjectMember, (member) => member.project)` relationship
- Property name: `projectMembers` or `members`
- Type: `ProjectMember[]`

##### Step 4: Update Imports
- Ensure all necessary imports are present
- Check for any decorators that reference `campDate` and update them

---

## 1.3 Backend DTOs

### 1.3.1 Modify CreateProjectDto

#### What to Do
Update the DTO to accept:
- `startDate` instead of `campDate`
- `endDate` as optional field
- `memberIds` array for team assignment

#### Where to Modify
**File Location**: `lims-backend/src/modules/projects/dto/create-project.dto.ts`

#### How to Do It

##### Step 1: Rename campDate
- Find `campDate?: string` property
- Rename to `startDate?: string`
- Keep validation decorators (IsOptional, IsDateString if present)

##### Step 2: Add endDate
- Add `endDate?: string` property
- Add `@IsOptional()` decorator
- Add `@IsDateString()` decorator if using class-validator
- Add validation: endDate must be after startDate if both provided

##### Step 3: Add memberIds
- Add `memberIds?: string[]` property
- Add `@IsOptional()` decorator
- Add `@IsArray()` decorator
- Add `@IsUUID(4, { each: true })` to validate each ID
- Add `@ApiProperty` decorator for Swagger documentation

##### Step 4: Update Swagger Documentation
- Update `@ApiProperty` descriptions
- Remove references to `campDate`
- Add description for new fields

---

### 1.3.2 Modify UpdateProjectDto

#### What to Do
Update the DTO to match CreateProjectDto changes.

#### Where to Modify
**File Location**: `lims-backend/src/modules/projects/dto/update-project.dto.ts`

#### How to Do It
- Apply same changes as CreateProjectDto
- All fields should be optional (use `@IsOptional()`)
- Keep `@PartialType(CreateProjectDto)` if using NestJS mapped types

---

### 1.3.3 Modify ProjectResponseDto

#### What to Do
Update response DTO to include:
- `startDate` instead of `campDate`
- `endDate` field
- `members` array (optional, for detailed views)

#### Where to Modify
**File Location**: `lims-backend/src/modules/projects/dto/project-response.dto.ts`

#### How to Do It

##### Step 1: Update Date Fields
- Rename `campDate` to `startDate`
- Add `endDate?: Date | null`
- Keep same types and optionality

##### Step 2: Add Members (Optional)
- Add `members?: ProjectMemberResponseDto[]` property
- Create new DTO file: `project-member-response.dto.ts` if needed
- Include: userId, userName, userRole, roleInProject

##### Step 3: Update Swagger
- Update all `@ApiProperty` decorators
- Add examples if needed

---

### 1.3.4 Create ProjectMemberResponseDto (Optional)

#### What to Do
Create a response DTO for project members to include user details.

#### Where to Create
**File Location**: `lims-backend/src/modules/projects/dto/project-member-response.dto.ts`

#### How to Do It
- Include: `id`, `userId`, `userName`, `userEmail`, `userRole`, `roleInProject`
- Use `@ApiProperty` for Swagger documentation
- Keep it simple - don't include full User entity

---

## 1.4 Backend Service Updates

### 1.4.1 Modify ProjectsService

#### What to Do
Update the service to:
1. Handle `startDate` and `endDate` instead of `campDate`
2. Create ProjectMember records when `memberIds` provided
3. Add methods for member management

#### Where to Modify
**File Location**: `lims-backend/src/modules/projects/projects.service.ts`

#### How to Do It

##### Step 1: Update create() Method
- Find where `campDate` is used
- Replace with `startDate`
- Add `endDate` handling
- Add validation: endDate must be >= startDate if both provided
- After creating project, if `memberIds` provided:
  - Validate all user IDs exist
  - Validate users are active
  - Create ProjectMember records for each
  - Handle errors gracefully

##### Step 2: Update findAll() Method
- Find all references to `campDate`
- Replace with `startDate`
- Update query filters for date range
- Update query parameter names in QueryProjectsDto

##### Step 3: Update findOne() Method
- Ensure it returns `startDate` and `endDate`
- Optionally include `members` relationship if needed

##### Step 4: Update update() Method
- Handle `startDate` updates
- Handle `endDate` updates
- Validate date logic if updating dates
- Don't allow setting endDate before startDate

##### Step 5: Add addMember() Method
- Method signature: `addMember(projectId: string, userId: string, roleInProject?: string)`
- Validate project exists
- Validate user exists and is active
- Check if membership already exists
- Create ProjectMember record
- Return updated project or member

##### Step 6: Add removeMember() Method
- Method signature: `removeMember(projectId: string, userId: string)`
- Validate project exists
- Find and delete ProjectMember record
- Handle case where member doesn't exist
- Return success status

##### Step 7: Add getProjectMembers() Method
- Method signature: `getProjectMembers(projectId: string)`
- Query ProjectMember with User relationship
- Return array of members with user details
- Include pagination if needed

##### Step 8: Add getProjectsForUser() Method
- Method signature: `getProjectsForUser(userId: string)`
- Query ProjectMember where userId matches
- Join with Project entity
- Return array of projects
- Filter by status if needed (only ACTIVE projects)

##### Step 9: Update Repository Injections
- Add `@InjectRepository(ProjectMember)` if not already present
- Add `@InjectRepository(User)` if needed for validation

---

## 1.5 Backend Controller Updates

#### What to Do
Add new endpoints for member management and update existing endpoints.

#### Where to Modify
**File Location**: `lims-backend/src/modules/projects/projects.controller.ts`

#### How to Do It

##### Step 1: Update Existing Endpoints
- Find all references to `campDate` in query parameters
- Replace with `startDate` and `endDate`
- Update Swagger `@ApiQuery` decorators
- Update method implementations to use new field names

##### Step 2: Add POST /projects/:id/members Endpoint
- Route: `POST /projects/:id/members`
- Access: SUPER_ADMIN only (use `@Roles()` decorator)
- Request body: `{ userId: string, roleInProject?: string }`
- Call `projectsService.addMember()`
- Return created member or updated project
- Add Swagger documentation

##### Step 3: Add DELETE /projects/:id/members/:userId Endpoint
- Route: `DELETE /projects/:id/members/:userId`
- Access: SUPER_ADMIN only
- Call `projectsService.removeMember()`
- Return success message
- Add Swagger documentation

##### Step 4: Add GET /projects/:id/members Endpoint
- Route: `GET /projects/:id/members`
- Access: All authenticated users (or restrict to project members)
- Call `projectsService.getProjectMembers()`
- Return array of members
- Add Swagger documentation

##### Step 5: Add GET /users/:userId/projects Endpoint
- Route: `GET /users/:userId/projects`
- Access: Own profile or SUPER_ADMIN
- Call `projectsService.getProjectsForUser()`
- Return array of projects
- Add Swagger documentation

##### Step 6: Update Swagger Tags
- Ensure all endpoints have proper `@ApiTags`
- Update descriptions to reflect new functionality

---

## 1.6 Create AdminSelectionService (CRITICAL)

#### What to Do
Create the missing AdminSelectionService implementation that was referenced but doesn't exist.

#### Where to Create
**File Location**: `lims-backend/src/modules/assignments/services/admin-selection.service.ts`

#### How to Do It

##### Step 1: Create Service Class
- Use `@Injectable()` decorator
- Inject User repository
- Inject Assignment repository
- Inject ProjectMember repository (for Phase 2)

##### Step 2: Implement findAvailableAdmin() Method
- Current signature: `findAvailableAdmin(adminRole: string): Promise<User | null>`
- Query users where:
  - `role = TEST_TECHNICIAN`
  - `isActive = true`
  - `testTechnicianType = adminRole`
- For each user, count active assignments (status != SUBMITTED)
- Return user with least assignments
- If tie, return oldest user (by createdAt)
- Return null if no users found

##### Step 3: Prepare for Phase 2 Enhancement
- Add optional `projectId` parameter (commented out for now)
- Document that this will be enhanced in Phase 2
- Keep method signature flexible

##### Step 4: Add Error Handling
- Handle database errors
- Log errors appropriately
- Return null on errors (don't throw)

##### Step 5: Update Module
- Ensure service is exported from AssignmentsModule
- Already imported in module.ts, just verify

---

## 1.7 Update ProjectsModule

#### What to Do
Ensure ProjectMember entity is registered in TypeORM.

#### Where to Modify
**File Location**: `lims-backend/src/modules/projects/projects.module.ts`

#### How to Do It
- Add ProjectMember to `TypeOrmModule.forFeature([...])` array
- Import User entity if needed for relationships
- Verify all dependencies are imported

---

## 1.8 Testing Requirements

### Unit Tests

#### What to Test
- ProjectMember entity creation and relationships
- ProjectsService.create() with memberIds
- ProjectsService.addMember()
- ProjectsService.removeMember()
- ProjectsService.getProjectsForUser()
- AdminSelectionService.findAvailableAdmin()

#### Where to Create Tests
- `lims-backend/src/modules/projects/projects.service.spec.ts`
- `lims-backend/src/modules/assignments/services/admin-selection.service.spec.ts` (already exists, update it)

#### How to Test
- Mock repositories
- Test happy paths
- Test error cases (duplicate members, invalid users, etc.)
- Test date validation logic

### Integration Tests

#### What to Test
- Migration runs successfully
- Data is preserved during campDate → startDate rename
- Orphan patients are assigned to Default Project
- ProjectMember records are created correctly

#### How to Test
- Run migration on test database
- Verify table structure
- Verify data integrity
- Verify indexes are created

---

## 1.9 Verification Checklist

Before moving to Phase 2, verify:

- [ ] Migration file created and tested
- [ ] project_members table exists with correct structure
- [ ] Indexes are created
- [ ] campDate renamed to startDate successfully
- [ ] endDate column added
- [ ] Orphan patients migrated to Default Project
- [ ] ProjectMember entity created
- [ ] Project entity updated
- [ ] All DTOs updated
- [ ] ProjectsService methods implemented
- [ ] ProjectsController endpoints added
- [ ] AdminSelectionService created and working
- [ ] ProjectsModule updated
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Swagger documentation updated
- [ ] No references to campDate remain in codebase

---

## 1.10 Common Pitfalls to Avoid

1. **Forgetting to update all DTOs** - Check CreateProjectDto, UpdateProjectDto, QueryProjectsDto, ProjectResponseDto
2. **Not handling nullable endDate** - Some projects may not have end dates
3. **Missing validation** - Validate endDate >= startDate
4. **Not testing migration rollback** - Always test both directions
5. **Forgetting indexes** - Performance will suffer without proper indexes
6. **Not handling duplicate members** - Unique constraint will throw error
7. **Missing AdminSelectionService** - This blocks Phase 2, must be done first

---

## 1.11 Next Steps

After completing Phase 1:
1. Review all changes with team
2. Run full test suite
3. Test migration on staging environment
4. Document any deviations from plan
5. Proceed to Phase 2 only after all checklist items are complete

