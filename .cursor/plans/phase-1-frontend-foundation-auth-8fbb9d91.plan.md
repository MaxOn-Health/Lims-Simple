---
name: Project/Company Management Feature Implementation
overview: ""
todos: []
---

# Project/Company Management Feature Implementation

## Overview

Add a Project entity that groups patients by employer/camp, with hierarchical access control:

- Super Admin: Create and manage projects
- Receptionist: Add patients to existing projects
- Enhanced reporting and filtering by project

## Database Changes

### 1. Create Project Entity

**File: `lims-backend/src/modules/projects/entities/project.entity.ts`**

```typescript
@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactPerson: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contactNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail: string;

  @Column({ type: 'date', nullable: true })
  campDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  campLocation: string;

  @Column({ type: 'jsonb', nullable: true })
  campSettings: {
    autoGeneratePatientIds: boolean;
    patientIdPrefix: string;
    requireEmployeeId: boolean;
    defaultPackageId?: string;
  };

  @Column({ type: 'integer', default: 0 })
  patientCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Patient, (patient) => patient.project)
  patients: Patient[];
}
```

### 2. Update Patient Entity

**File: `lims-backend/src/modules/patients/entities/patient.entity.ts`**

Add project relationship:

```typescript
@ManyToOne(() => Project, { nullable: true })
@JoinColumn({ name: 'project_id' })
project: Project | null;

@Column({ type: 'uuid', nullable: true, name: 'project_id' })
@Index()
projectId: string | null;
```

### 3. Create Migration

**File: `lims-backend/src/database/migrations/1700000014000-CreateProjectsTable.ts`**

- Create projects table with all fields
- Add project_id column to patients table
- Add foreign key constraint

## Backend Implementation

### 1. Project Module

**Files to create:**

- `lims-backend/src/modules/projects/projects.module.ts`
- `lims-backend/src/modules/projects/projects.service.ts`
- `lims-backend/src/modules/projects/projects.controller.ts`
- `lims-backend/src/modules/projects/dto/`
  - `create-project.dto.ts`
  - `update-project.dto.ts`
  - `query-projects.dto.ts`

### 2. Update Patient Service

**File: `lims-backend/src/modules/patients/patients.service.ts`**

- Update createPatient to accept optional projectId
- Add project validation (receptionist can only use active projects)
- Update patient queries to include project data

### 3. Update Patient DTOs

**File: `lims-backend/src/modules/patients/dto/create-patient.dto.ts`**

- Add optional projectId field
- Add validation to ensure receptionist uses valid project

## Frontend Implementation

### 1. Project Types

**File: `lims-frontend/src/types/project.types.ts`**

```typescript
export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SCHEDULED = 'SCHEDULED',
}

export interface Project {
  id: string;
  name: string;
  description: string;
  companyName?: string;
  contactPerson?: string;
  contactNumber?: string;
  contactEmail?: string;
  campDate?: string;
  campLocation?: string;
  campSettings?: {
    autoGeneratePatientIds: boolean;
    patientIdPrefix: string;
    requireEmployeeId: boolean;
    defaultPackageId?: string;
  };
  patientCount: number;
  totalRevenue: number;
  status: ProjectStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2. Project Service

**File: `lims-frontend/src/services/api/projects.service.ts`**

- CRUD operations for projects
- Get active projects for receptionists

### 3. Project Management UI (Super Admin)

**Files to create:**

- `lims-frontend/src/components/projects/ProjectForm/ProjectForm.tsx`
- `lims-frontend/src/components/projects/ProjectList/ProjectList.tsx`
- `lims-frontend/src/components/projects/ProjectView/ProjectView.tsx`
- `lims-frontend/src/app/projects/page.tsx`
- `lims-frontend/src/app/projects/new/page.tsx`
- `lims-frontend/src/app/projects/[id]/page.tsx`

### 4. Update Patient Registration Form

**File: `lims-frontend/src/components/patients/PatientForm/PatientForm.tsx`**

- Add project selection dropdown (for receptionists)
- Auto-populate company name from project
- Apply project settings (patient ID prefix, employee ID requirement)
- Show project details in form header

### 5. Update Patient List

**File: `lims-frontend/src/components/patients/PatientList/PatientList.tsx`**

- Add project filter
- Show project column
- Group by project option

### 6. Navigation Updates

**File: `lims-frontend/src/components/common/Sidebar/Sidebar.tsx`**

- Add "Projects" link for Super Admin role

## Key Features

### 1. Project Creation (Super Admin)

- Create new project/company
- Set camp dates and location
- Configure patient ID settings
- Set default package for the project

### 2. Patient Registration (Receptionist)

- Select project from dropdown (active projects only)
- Auto-fill company details from project
- Generate patient IDs with project prefix
- Enforce employee ID if required by project

### 3. Reporting Enhancements

- Filter patients by project
- Project-wise revenue reports
- Patient count per project
- Camp completion tracking

### 4. Access Control

- Super Admin: Full project management
- Receptionist: View active projects, add patients
- Other roles: View-only access to project data

## Implementation Order

1. Database changes (migration)
2. Backend Project module
3. Update Patient module
4. Frontend types and service
5. Project management UI
6. Update patient registration
7. Update patient list and filters
8. Navigation updates
9. Testing and validation