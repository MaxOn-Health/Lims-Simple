# LIMS Software - SaaS Product Plan
## Laboratory Information Management System for Diagnostic Centers

---

## 1. Project Overview

### 1.1 Purpose
A comprehensive LIMS platform for diagnostic centers managing health camps for employees. The system handles patient registration, test assignment, result entry, doctor review, and automated report generation.

### 1.2 Core Value Proposition
- Streamlined patient flow from registration to report generation
- Role-based access control ensuring data security
- Tamper-proof test results with audit trails
- Automated workflow management
- Scalable SaaS architecture

### 1.3 Technology Stack
- **Frontend**: Next.js 14+ (App Router)
- **Backend**: NestJS (RESTful API)
- **Database**: PostgreSQL (with transactions and constraints)
- **Authentication**: JWT + Passkey for doctors
- **File Storage**: AWS S3 / Cloudinary (for reports)
- **Deployment**: Docker containers, AWS/GCP

---

## 2. User Roles & Permissions (RBAC)

### 2.1 Super Admin
- Full system access
- Manage all users, packages, tests
- View all reports and analytics
- System configuration

### 2.2 Receptionist/Registration Staff
- Register patients
- Select packages and addon services
- Assign tests to admins
- View patient status
- Generate reports

### 2.3 Test Admins (Audiometry, X-Ray, Eye Test, PFT, etc.)
- View assigned patients in dashboard
- Search patients (by ID/name)
- Enter test results
- Submit completed tests
- View own test history

### 2.4 Lab Technician (Blood Test)
- Access blood test samples (with passcode)
- Enter blood test results
- Submit lab reports
- View lab test history

### 2.5 Doctor
- View all test results for assigned patients
- Add clinical remarks
- Sign reports (with passkey)
- View patient history
- Access all test details

---

## 3. Core Features & Functionalities

### 3.1 Package Management
- **Create Packages**: Name, description, price, validity period
- **Assign Tests**: Select multiple tests per package
- **Pricing**: Package price + individual test pricing
- **Edit/Delete**: Modify packages (with history tracking)

### 3.2 Test Management
- **Test Types**: 
  - On-site tests (Audiometry, X-Ray, Eye Test, PFT, etc.)
  - Lab tests (Blood tests - special handling)
- **Test Configuration**: Name, description, normal ranges, units
- **Admin Assignment**: Map tests to admin roles
- **Test Categories**: Group related tests

### 3.3 Patient Registration
- **Basic Info**: Name, age, gender, contact, employee ID, company name
- **Package Selection**: Choose from available packages
- **Addon Services**: Add individual tests not in package
- **Payment**: Record payment status
- **Generate Patient ID**: Unique identifier

### 3.4 Test Assignment
- **Automatic Assignment**: Based on package tests → assign to respective admins
- **Manual Override**: Receptionist can manually assign/reassign
- **Status Tracking**: Pending, In Progress, Completed, Assigned

### 3.5 Admin Dashboards
- **Assigned Patients**: List of patients assigned to admin
- **Search Functionality**: Search by patient ID or name (popup/modal)
- **Test Entry Form**: 
  - Patient details (read-only)
  - Test-specific fields
  - Value entry with validation
  - Normal range indicators
  - Submit button
- **Status Indicators**: Pending, Completed, Submitted

### 3.6 Blood Test Workflow
- **Sample Collection**: Register sample with passcode
- **Passcode Protection**: Only lab technician with passcode can access
- **Lab Entry**: Enter results after testing
- **Verification**: Double-check before submission

### 3.7 Doctor Dashboard
- **Assigned Patients**: Patients ready for review
- **Test Results View**: All test results in one place
- **Remarks Section**: Add clinical observations
- **Sign Report**: Passkey authentication required
- **Report Preview**: Before signing

### 3.8 Report Generation
- **Automatic Trigger**: When all tests completed + doctor signed
- **Report Components**:
  - Patient information
  - All test results with values
  - Normal ranges comparison
  - Doctor remarks
  - Doctor signature (digital)
  - Report date and validity
- **PDF Generation**: Downloadable report
- **Email/SMS**: Optional notification to patient

### 3.9 Audit Trail
- **All Actions Logged**: Who did what, when
- **Data Changes**: Track modifications to test results
- **Access Logs**: Who accessed which patient data
- **Tamper Detection**: Alert on unauthorized changes

---

## 4. Screen/UI Requirements

### 4.1 Authentication Screens
- **Login**: Email/username + password
- **Forgot Password**: Reset flow
- **Passkey Setup**: For doctors (during first login)

### 4.2 Super Admin Screens
- **Dashboard**: Overview statistics
- **User Management**: Create/edit users, assign roles
- **Package Management**: CRUD operations
- **Test Management**: CRUD operations
- **System Settings**: Configuration
- **Audit Logs**: View system activity

### 4.3 Receptionist Screens
- **Dashboard**: Today's registrations, pending assignments
- **Patient Registration**: Multi-step form
  - Step 1: Basic information
  - Step 2: Package selection
  - Step 3: Addon services
  - Step 4: Payment & confirmation
- **Patient List**: All registered patients with status
- **Assign Tests**: Drag-drop or checkbox assignment
- **Report Generation**: View/download reports

### 4.4 Test Admin Screens
- **Dashboard**: Assigned patients count, today's tasks
- **Patient List**: Filterable list (Pending, In Progress, Completed)
- **Search Modal**: Quick search by ID/name
- **Test Entry Form**: 
  - Patient card (read-only)
  - Test-specific input fields
  - Save draft / Submit final
  - Validation warnings
- **History**: Previously completed tests

### 4.5 Lab Technician Screens
- **Dashboard**: Pending blood test samples
- **Passcode Entry**: Secure access to sample details
- **Result Entry**: Blood test specific form
- **Sample Tracking**: Track sample status

### 4.6 Doctor Screens
- **Dashboard**: Patients awaiting review
- **Patient Detail View**: 
  - All test results in tabs/cards
  - Visual indicators (normal/abnormal)
  - Remarks editor
  - Report preview
- **Sign Report**: Passkey authentication modal
- **Signed Reports**: History of reviewed patients

### 4.7 Common Components
- **Header**: User info, notifications, logout
- **Sidebar Navigation**: Role-based menu
- **Status Badges**: Color-coded (Pending, In Progress, Completed)
- **Search Bar**: Global search (role-based results)
- **Notifications**: Real-time updates

---

## 5. Backend Architecture (NestJS)

### 5.1 Module Structure
```
- Auth Module (JWT, Passkey)
- User Module (RBAC)
- Package Module
- Test Module
- Patient Module
- Assignment Module
- Result Module
- Report Module
- Audit Module
- Notification Module
```

### 5.2 Database Schema (Key Tables)
- **users**: id, email, password_hash, role, created_at
- **packages**: id, name, description, price, validity_days, created_at
- **tests**: id, name, description, category, normal_range_min, normal_range_max, unit, admin_role
- **package_tests**: package_id, test_id (many-to-many)
- **patients**: id, name, age, gender, contact, employee_id, company, patient_id (unique), created_at
- **patient_packages**: patient_id, package_id, addon_tests (JSON), total_price, payment_status
- **assignments**: id, patient_id, test_id, admin_id, status, assigned_at, completed_at
- **test_results**: id, assignment_id, patient_id, test_id, values (JSON), entered_by, entered_at, verified_at
- **blood_samples**: id, patient_id, sample_id, passcode_hash, collected_at, status
- **doctor_reviews**: id, patient_id, doctor_id, remarks, signed_at, passkey_verified
- **reports**: id, patient_id, report_number, generated_at, pdf_url, status
- **audit_logs**: id, user_id, action, entity_type, entity_id, changes (JSON), timestamp

### 5.3 API Endpoints (Key)
```
Authentication:
POST /auth/login
POST /auth/logout
POST /auth/setup-passkey
POST /auth/verify-passkey

Users:
GET /users (admin only)
POST /users
PUT /users/:id
DELETE /users/:id

Packages:
GET /packages
POST /packages
PUT /packages/:id
DELETE /packages/:id

Tests:
GET /tests
POST /tests
PUT /tests/:id

Patients:
POST /patients/register
GET /patients
GET /patients/:id
PUT /patients/:id

Assignments:
POST /assignments/create
GET /assignments/my-assignments
PUT /assignments/:id/assign-admin
GET /assignments/patient/:patientId

Results:
POST /results/submit
PUT /results/:id
GET /results/patient/:patientId

Blood Tests:
POST /blood-samples/register
POST /blood-samples/access (with passcode)
POST /blood-samples/:id/results

Doctor:
GET /doctor/patients
GET /doctor/patient/:patientId/results
POST /doctor/review
POST /doctor/sign-report

Reports:
GET /reports/patient/:patientId
POST /reports/generate/:patientId
GET /reports/:id/download
```

### 5.4 Security Measures
- **JWT Tokens**: Short-lived access tokens + refresh tokens
- **Password Hashing**: bcrypt with salt rounds
- **Passkey Authentication**: WebAuthn for doctors
- **Input Validation**: DTOs with class-validator
- **SQL Injection Prevention**: TypeORM parameterized queries
- **CORS**: Configured for frontend domain only
- **Rate Limiting**: Prevent brute force attacks
- **Data Encryption**: Sensitive fields encrypted at rest
- **Audit Logging**: All critical operations logged

### 5.5 Data Integrity
- **Database Constraints**: Foreign keys, unique constraints, check constraints
- **Transactions**: Multi-step operations in transactions
- **Validation Rules**: Normal range checks, required fields
- **Immutable Results**: Once submitted, results cannot be edited (only via admin override with audit)
- **Version Control**: Track changes to critical data
- **Backup Strategy**: Daily automated backups

---

## 6. Frontend Architecture (Next.js)

### 6.1 Folder Structure
```
app/
  (auth)/
    login/
    forgot-password/
  (dashboard)/
    layout.tsx
    dashboard/
    patients/
    packages/
    tests/
    reports/
  api/ (API routes if needed)
components/
  common/
  forms/
  tables/
  modals/
lib/
  api/
  auth/
  utils/
hooks/
  useAuth.ts
  usePatients.ts
types/
  user.ts
  patient.ts
  test.ts
```

### 6.2 State Management
- **Server State**: React Query / SWR for API calls
- **Client State**: Zustand / Context API for UI state
- **Form State**: React Hook Form + Zod validation

### 6.3 Key Features
- **Server-Side Rendering**: For SEO and performance
- **Protected Routes**: Middleware for role-based access
- **Real-time Updates**: WebSocket for notifications (optional)
- **Responsive Design**: Mobile-friendly
- **Error Handling**: Global error boundary
- **Loading States**: Skeleton loaders

---

## 7. Phase-wise Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Basic authentication and user management

**Features**:
- User authentication (login/logout)
- User CRUD (Super Admin)
- Role-based routing
- Basic dashboard layouts

**Deliverables**:
- Auth system working
- Admin can create users with roles
- Protected routes functional

---

### Phase 2: Core Configuration (Weeks 3-4)
**Goal**: Package and test management

**Features**:
- Create/edit packages
- Create/edit tests
- Assign tests to packages
- Map tests to admin roles

**Deliverables**:
- Super Admin can configure packages and tests
- Test-to-admin mapping working

---

### Phase 3: Patient Registration (Weeks 5-6)
**Goal**: Patient onboarding

**Features**:
- Patient registration form
- Package selection
- Addon services selection
- Patient ID generation
- Payment status tracking

**Deliverables**:
- Receptionist can register patients
- Patients assigned to packages

---

### Phase 4: Test Assignment (Week 7)
**Goal**: Automatic and manual test assignment

**Features**:
- Automatic assignment based on package
- Manual assignment interface
- Assignment status tracking
- Admin dashboard showing assignments

**Deliverables**:
- Tests automatically assigned to admins
- Admins see assigned patients

---

### Phase 5: Test Result Entry (Weeks 8-9)
**Goal**: Admins can enter test results

**Features**:
- Admin dashboard with patient list
- Search functionality
- Test entry forms (per test type)
- Result submission
- Validation and error handling

**Deliverables**:
- Admins can enter and submit results
- Results stored securely

---

### Phase 6: Blood Test Workflow (Week 10)
**Goal**: Special handling for blood tests

**Features**:
- Blood sample registration with passcode
- Passcode-protected access
- Lab technician result entry
- Sample tracking

**Deliverables**:
- Blood test workflow complete
- Secure passcode system

---

### Phase 7: Doctor Review (Weeks 11-12)
**Goal**: Doctor can review and sign reports

**Features**:
- Doctor dashboard
- View all test results
- Add remarks
- Passkey setup and verification
- Sign report functionality

**Deliverables**:
- Doctors can review and sign reports
- Passkey authentication working

---

### Phase 8: Report Generation (Week 13)
**Goal**: Automated report generation

**Features**:
- Automatic trigger when all tests done
- Report template design
- PDF generation
- Download functionality
- Email/SMS notifications (optional)

**Deliverables**:
- Reports generated automatically
- PDF reports downloadable

---

### Phase 9: Audit & Security (Week 14)
**Goal**: Complete audit trail and security hardening

**Features**:
- Audit logging for all actions
- Data change tracking
- Security audit
- Performance optimization
- Error handling improvements

**Deliverables**:
- Full audit trail functional
- Security measures in place

---

### Phase 10: Testing & Deployment (Weeks 15-16)
**Goal**: Quality assurance and launch

**Features**:
- Unit tests
- Integration tests
- User acceptance testing
- Bug fixes
- Deployment setup
- Documentation

**Deliverables**:
- Tested and deployed application
- User documentation

---

## 8. MVP Features (Must Have)

### 8.1 Essential Features
1. ✅ User authentication and RBAC
2. ✅ Package and test management
3. ✅ Patient registration
4. ✅ Test assignment (automatic)
5. ✅ Test result entry by admins
6. ✅ Blood test passcode system
7. ✅ Doctor review and signing
8. ✅ Basic report generation
9. ✅ Audit logging

### 8.2 Nice to Have (Post-MVP)
- Email/SMS notifications
- Advanced analytics dashboard
- Mobile app
- Multi-tenant support (for SaaS)
- Payment gateway integration
- Advanced search and filters
- Bulk operations
- Export functionality

---

## 9. Security Checklist

- [ ] JWT token expiration and refresh
- [ ] Password complexity requirements
- [ ] Passkey implementation for doctors
- [ ] Input sanitization and validation
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Rate limiting
- [ ] HTTPS only
- [ ] Data encryption at rest
- [ ] Regular security audits
- [ ] Backup and disaster recovery

---

## 10. Scalability Considerations

### 10.1 Database
- Indexing on frequently queried fields
- Connection pooling
- Read replicas for reporting
- Partitioning for large tables (audit_logs)

### 10.2 Backend
- Horizontal scaling with load balancer
- Caching (Redis) for frequently accessed data
- Queue system for report generation (Bull/BullMQ)
- Microservices architecture (future)

### 10.3 Frontend
- Code splitting
- Image optimization
- CDN for static assets
- Server-side rendering optimization

---

## 11. Success Metrics

- Patient registration time < 5 minutes
- Test result entry time < 2 minutes per test
- Report generation time < 30 seconds
- System uptime > 99.5%
- Zero data loss incidents
- User satisfaction score > 4/5

---

## 12. Risk Mitigation

### 12.1 Data Loss
- **Risk**: Critical test data lost
- **Mitigation**: Automated backups, transaction logs, data validation

### 12.2 Security Breach
- **Risk**: Unauthorized access to patient data
- **Mitigation**: RBAC, audit logs, encryption, regular security audits

### 12.3 System Downtime
- **Risk**: System unavailable during camp
- **Mitigation**: High availability setup, monitoring, quick rollback

### 12.4 Data Tampering
- **Risk**: Test results modified incorrectly
- **Mitigation**: Immutable results, audit trail, role restrictions

---

## 13. Future Enhancements

1. **Multi-tenant SaaS**: Support multiple diagnostic centers
2. **Mobile App**: Native apps for admins and doctors
3. **AI Integration**: Anomaly detection in test results
4. **Advanced Analytics**: Predictive health insights
5. **Integration**: EMR systems, billing software
6. **Telemedicine**: Remote doctor consultations
7. **Blockchain**: Immutable test result storage

---

## 14. Documentation Requirements

- API documentation (Swagger/OpenAPI)
- User manuals (per role)
- Admin guide
- Developer documentation
- Deployment guide
- Security policy document

---

## Conclusion

This plan provides a comprehensive roadmap for building a secure, scalable LIMS SaaS product. The phase-wise approach ensures incremental delivery with working features at each stage. Focus on MVP features first, then iterate based on user feedback.

**Key Principles**:
- Security first
- Data integrity is non-negotiable
- Simple and intuitive UX
- Scalable architecture
- Comprehensive audit trail

---

*Document Version: 1.0*  
*Last Updated: [Date]*

