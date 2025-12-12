import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { Package } from '../../modules/packages/entities/package.entity';
import { Test, TestField } from '../../modules/tests/entities/test.entity';
import { TestCategory } from '../../modules/tests/constants/test-category';
import { TestFieldType } from '../../modules/tests/constants/test-field-types';
import { PackageTest } from '../../modules/packages/entities/package-test.entity';
import { Patient } from '../../modules/patients/entities/patient.entity';
import { Gender } from '../../modules/patients/constants/gender.enum';
import { PatientPackage } from '../../modules/patients/entities/patient-package.entity';
import { PaymentStatus } from '../../modules/patients/constants/payment-status.enum';
import { Assignment } from '../../modules/assignments/entities/assignment.entity';
import { AssignmentStatus } from '../../modules/assignments/constants/assignment-status.enum';
import { TestResult } from '../../modules/results/entities/test-result.entity';
import { BloodSample } from '../../modules/blood-samples/entities/blood-sample.entity';
import { BloodSampleStatus } from '../../modules/blood-samples/constants/blood-sample-status.enum';
import { DoctorReview } from '../../modules/doctor-reviews/entities/doctor-review.entity';
import { Report } from '../../modules/reports/entities/report.entity';
import { ReportStatus } from '../../modules/reports/constants/report-status.enum';

config();

// Parse DATABASE_URL if available
function parseDbUrl(url: string) {
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = url.match(regex);
  if (match) {
    return {
      username: decodeURIComponent(match[1]),
      password: decodeURIComponent(match[2]),
      host: match[3],
      port: parseInt(match[4], 10),
      database: match[5],
    };
  }
  return null;
}

const dbUrl = process.env.DATABASE_URL;
const parsed = dbUrl ? parseDbUrl(dbUrl) : null;

const dataSource = new DataSource({
  type: 'postgres',
  host: parsed?.host || process.env.DATABASE_HOST || 'localhost',
  port: parsed?.port || parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: parsed?.username || process.env.DATABASE_USERNAME || process.env.USER || 'postgres',
  password: parsed?.password || process.env.DATABASE_PASSWORD || '',
  database: parsed?.database || process.env.DATABASE_NAME || 'lims_db',
  entities: [path.join(__dirname, '../../**/*.entity{.ts,.js}')],
  synchronize: false,
  logging: false,
  ssl: { rejectUnauthorized: false },
});

async function seedAll() {
  try {
    await dataSource.initialize();
    console.log('Database connection established');

    console.log('\n=== Seeding Test Data for Phases 1-9 ===\n');

    // Phase 1 & 2: Users
    console.log('Phase 1-2: Creating users...');
    const users = await createUsers(dataSource);
    console.log(`✓ Created ${users.all.length} users`);

    // Phase 3: Packages and Tests
    console.log('\nPhase 3: Creating packages and tests...');
    const { packages, tests } = await createPackagesAndTests(dataSource);
    console.log(`✓ Created ${packages.length} packages and ${tests.length} tests`);

    // Phase 4: Patients
    console.log('\nPhase 4: Creating patients...');
    const patients = await createPatients(dataSource, packages, users.receptionist.id);
    console.log(`✓ Created ${patients.length} patients`);

    // Phase 5: Assignments
    console.log('\nPhase 5: Creating assignments...');
    const assignments = await createAssignments(dataSource, patients, tests, users.testAdmins);
    console.log(`✓ Created ${assignments.length} assignments`);

    // Phase 6: Test Results
    console.log('\nPhase 6: Submitting test results...');
    const results = await submitResults(dataSource, assignments, users.testAdmins);
    console.log(`✓ Submitted ${results.length} results`);

    // Phase 7: Blood Samples
    console.log('\nPhase 7: Creating blood samples...');
    const bloodSamples = await createBloodSamples(dataSource, patients, users.labTechnician.id);
    console.log(`✓ Created ${bloodSamples.length} blood samples`);

    // Phase 8: Doctor Reviews
    console.log('\nPhase 8: Creating doctor reviews...');
    const reviews = await createDoctorReviews(dataSource, patients, users.doctor.id);
    console.log(`✓ Created ${reviews.length} doctor reviews`);

    // Phase 9: Reports (will be auto-generated when doctor signs)
    console.log('\nPhase 9: Reports will be auto-generated when doctor signs reviews');

    console.log('\n=== Seed Data Summary ===');
    console.log(`Users: ${users.all.length}`);
    console.log(`Packages: ${packages.length}`);
    console.log(`Tests: ${tests.length}`);
    console.log(`Patients: ${patients.length}`);
    console.log(`Assignments: ${assignments.length}`);
    console.log(`Results: ${results.length}`);
    console.log(`Blood Samples: ${bloodSamples.length}`);
    console.log(`Doctor Reviews: ${reviews.length}`);

    console.log('\n=== Test Credentials ===');
    console.log('Super Admin: admin@lims.com / Admin@123');
    console.log('Receptionist: receptionist@lims.com / Receptionist@123');
    console.log('Test Admin (Audiometry): audiometry@lims.com / TestAdmin@123');
    console.log('Test Admin (X-Ray): xray@lims.com / TestAdmin@123');
    console.log('Lab Technician: labtech@lims.com / LabTech@123');
    console.log('Doctor: doctor@lims.com / Doctor@123');

    await dataSource.destroy();
    console.log('\n✓ Seed completed successfully!');
  } catch (error) {
    console.error('Error running seed:', error);
    process.exit(1);
  }
}

async function createUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const receptionistHash = await bcrypt.hash('Receptionist@123', 10);
  const testAdminHash = await bcrypt.hash('TestAdmin@123', 10);
  const labTechHash = await bcrypt.hash('LabTech@123', 10);
  const doctorHash = await bcrypt.hash('Doctor@123', 10);

  const users: User[] = [];

  // Super Admin
  let superAdmin = await userRepository.findOne({ where: { email: 'admin@lims.com' } });
  if (!superAdmin) {
    superAdmin = userRepository.create({
      email: 'admin@lims.com',
      passwordHash,
      fullName: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      testTechnicianType: null,
      isActive: true,
    });
    superAdmin = await userRepository.save(superAdmin);
  }
  users.push(superAdmin);

  // Receptionist
  let receptionist = await userRepository.findOne({ where: { email: 'receptionist@lims.com' } });
  if (!receptionist) {
    receptionist = userRepository.create({
      email: 'receptionist@lims.com',
      passwordHash: receptionistHash,
      fullName: 'Receptionist User',
      role: UserRole.RECEPTIONIST,
      testTechnicianType: null,
      isActive: true,
    });
    receptionist = await userRepository.save(receptionist);
  }
  users.push(receptionist);

  // Test Admins
  const testTechnicianSpecialties = ['audiometry', 'xray', 'eye_test', 'pft'];
  const testAdmins: User[] = [];
  for (const adminType of testTechnicianSpecialties) {
    let testAdmin = await userRepository.findOne({
      where: { email: `${adminType}@lims.com` },
    });
    if (!testAdmin) {
      testAdmin = userRepository.create({
        email: `${adminType}@lims.com`,
        passwordHash: testAdminHash,
        fullName: `${adminType.charAt(0).toUpperCase() + adminType.slice(1)} Admin`,
        role: UserRole.TEST_TECHNICIAN,
        testTechnicianType: adminType,
        isActive: true,
      });
      testAdmin = await userRepository.save(testAdmin);
    }
    testAdmins.push(testAdmin);
    users.push(testAdmin);
  }

  // Lab Technician
  let labTechnician = await userRepository.findOne({ where: { email: 'labtech@lims.com' } });
  if (!labTechnician) {
    labTechnician = userRepository.create({
      email: 'labtech@lims.com',
      passwordHash: labTechHash,
      fullName: 'Lab Technician',
      role: UserRole.LAB_TECHNICIAN,
      testTechnicianType: null,
      isActive: true,
    });
    labTechnician = await userRepository.save(labTechnician);
  } else {
    // Update password hash if user exists to ensure correct password
    labTechnician.passwordHash = labTechHash;
    labTechnician = await userRepository.save(labTechnician);
  }
  users.push(labTechnician);

  // Doctor
  let doctor = await userRepository.findOne({ where: { email: 'doctor@lims.com' } });
  if (!doctor) {
    doctor = userRepository.create({
      email: 'doctor@lims.com',
      passwordHash: doctorHash,
      fullName: 'Dr. Test Doctor',
      role: UserRole.DOCTOR,
      testTechnicianType: null,
      isActive: true,
    });
    doctor = await userRepository.save(doctor);
  }
  users.push(doctor);

  return {
    superAdmin,
    receptionist,
    testAdmins,
    labTechnician,
    doctor,
    all: users,
  };
}

async function createPackagesAndTests(dataSource: DataSource) {
  const packageRepository = dataSource.getRepository(Package);
  const testRepository = dataSource.getRepository(Test);
  const packageTestRepository = dataSource.getRepository(PackageTest);

  // Create Tests
  const testData = [
    {
      name: 'Audiometry Test',
      description: 'Hearing test for both ears at multiple frequencies (125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000 Hz)',
      category: TestCategory.ON_SITE,
      adminRole: 'audiometry',
      normalRangeMin: -10,
      normalRangeMax: 25,
      unit: 'dB HL',
      testFields: [
        // Right ear frequencies
        { field_name: 'right_125', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'right_250', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'right_500', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'right_750', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'right_1000', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'right_1500', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'right_2000', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'right_3000', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'right_4000', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'right_6000', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'right_8000', field_type: TestFieldType.NUMBER, required: false, options: null },
        // Left ear frequencies
        { field_name: 'left_125', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'left_250', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'left_500', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'left_750', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'left_1000', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'left_1500', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'left_2000', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'left_3000', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'left_4000', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'left_6000', field_type: TestFieldType.NUMBER, required: false, options: null },
        { field_name: 'left_8000', field_type: TestFieldType.NUMBER, required: false, options: null },
      ] as TestField[],
    },
    {
      name: 'X-Ray Chest',
      description: 'Chest X-Ray examination',
      category: TestCategory.ON_SITE,
      adminRole: 'xray',
      normalRangeMin: null,
      normalRangeMax: null,
      unit: null,
      testFields: [
        { field_name: 'findings', field_type: TestFieldType.TEXT, required: true, options: null },
        { field_name: 'impression', field_type: TestFieldType.TEXT, required: false, options: null },
      ] as TestField[],
    },
    {
      name: 'Eye Test',
      description: 'Vision test',
      category: TestCategory.ON_SITE,
      adminRole: 'eye_test',
      normalRangeMin: 6,
      normalRangeMax: 6,
      unit: 'meters',
      testFields: [
        { field_name: 'left_eye', field_type: TestFieldType.NUMBER, required: true, options: null },
        { field_name: 'right_eye', field_type: TestFieldType.NUMBER, required: true, options: null },
      ] as TestField[],
    },
    {
      name: 'PFT Test',
      description: 'Pulmonary Function Test',
      category: TestCategory.ON_SITE,
      adminRole: 'pft',
      normalRangeMin: 80,
      normalRangeMax: 120,
      unit: '%',
      testFields: [
        { field_name: 'fev1', field_type: TestFieldType.NUMBER, required: true, options: null },
        { field_name: 'fvc', field_type: TestFieldType.NUMBER, required: true, options: null },
      ] as TestField[],
    },
    {
      name: 'Blood Test - Complete Blood Count',
      description: 'CBC test',
      category: TestCategory.LAB,
      adminRole: 'lab',
      normalRangeMin: null,
      normalRangeMax: null,
      unit: null,
      testFields: [
        { field_name: 'hemoglobin', field_type: TestFieldType.NUMBER, required: true, options: null },
        { field_name: 'rbc_count', field_type: TestFieldType.NUMBER, required: true, options: null },
        { field_name: 'wbc_count', field_type: TestFieldType.NUMBER, required: true, options: null },
      ] as TestField[],
    },
  ];

  const tests: Test[] = [];
  for (const testInfo of testData) {
    let test = await testRepository.findOne({ where: { name: testInfo.name } });
    if (!test) {
      test = testRepository.create(testInfo);
      test = await testRepository.save(test);
    }
    tests.push(test);
  }

  // Create Packages
  const packageData = [
    {
      name: 'Basic Health Package',
      description: 'Basic health screening package',
      price: 1500.00,
      validityDays: 365,
    },
    {
      name: 'Comprehensive Health Package',
      description: 'Comprehensive health screening package',
      price: 3000.00,
      validityDays: 365,
    },
  ];

  const packages: Package[] = [];
  for (const pkgInfo of packageData) {
    let pkg = await packageRepository.findOne({ where: { name: pkgInfo.name } });
    if (!pkg) {
      pkg = packageRepository.create(pkgInfo);
      pkg = await packageRepository.save(pkg);
    }
    packages.push(pkg);
  }

  // Link tests to packages
  // Basic package: first 3 tests
  for (let i = 0; i < 3 && i < tests.length; i++) {
    const existing = await packageTestRepository.findOne({
      where: { packageId: packages[0].id, testId: tests[i].id },
    });
    if (!existing) {
      const packageTest = packageTestRepository.create({
        packageId: packages[0].id,
        testId: tests[i].id,
        testPrice: null,
      });
      await packageTestRepository.save(packageTest);
    }
  }

  // Comprehensive package: all tests
  for (const test of tests) {
    const existing = await packageTestRepository.findOne({
      where: { packageId: packages[1].id, testId: test.id },
    });
    if (!existing) {
      const packageTest = packageTestRepository.create({
        packageId: packages[1].id,
        testId: test.id,
        testPrice: null,
      });
      await packageTestRepository.save(packageTest);
    }
  }

  return { packages, tests };
}

async function createPatients(
  dataSource: DataSource,
  packages: Package[],
  receptionistId: string,
) {
  const patientRepository = dataSource.getRepository(Patient);
  const patientPackageRepository = dataSource.getRepository(PatientPackage);

  const patientData = [
    {
      name: 'John Doe',
      age: 35,
      gender: Gender.MALE,
      contactNumber: '+1234567890',
      email: 'john.doe@example.com',
      employeeId: 'EMP001',
      companyName: 'Tech Corp',
      address: '123 Main St, City',
    },
    {
      name: 'Jane Smith',
      age: 28,
      gender: Gender.FEMALE,
      contactNumber: '+1234567891',
      email: 'jane.smith@example.com',
      employeeId: 'EMP002',
      companyName: 'Tech Corp',
      address: '456 Oak Ave, City',
    },
    {
      name: 'Bob Johnson',
      age: 42,
      gender: Gender.MALE,
      contactNumber: '+1234567892',
      email: 'bob.johnson@example.com',
      employeeId: 'EMP003',
      companyName: 'Health Inc',
      address: '789 Pine Rd, City',
    },
  ];

  const patients: Patient[] = [];
  for (const patientInfo of patientData) {
    let patient = await patientRepository.findOne({
      where: { contactNumber: patientInfo.contactNumber },
    });
    if (!patient) {
      // Generate patient ID
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const prefix = `PAT-${dateStr}-`;
      const existingPatients = await patientRepository
        .createQueryBuilder('patient')
        .where('patient.patientId LIKE :prefix', { prefix: `${prefix}%` })
        .orderBy('patient.patientId', 'DESC')
        .getMany();

      let sequence = 1;
      if (existingPatients.length > 0) {
        const lastPatientId = existingPatients[0].patientId;
        const lastSequenceStr = lastPatientId.split('-')[2];
        const lastSequence = parseInt(lastSequenceStr, 10);
        if (!isNaN(lastSequence)) {
          sequence = lastSequence + 1;
        }
      }
      const patientId = `${prefix}${sequence.toString().padStart(4, '0')}`;

      patient = patientRepository.create({
        ...patientInfo,
        patientId,
      });
      patient = await patientRepository.save(patient);

      // Assign package
      const patientPackage = patientPackageRepository.create({
        patientId: patient.id,
        packageId: packages[patients.length % packages.length].id,
        addonTestIds: [],
        totalPrice: packages[patients.length % packages.length].price,
        paymentStatus: PaymentStatus.PAID,
        paymentAmount: packages[patients.length % packages.length].price,
        registeredBy: receptionistId,
      });
      await patientPackageRepository.save(patientPackage);
    }
    patients.push(patient);
  }

  return patients;
}

async function createAssignments(
  dataSource: DataSource,
  patients: Patient[],
  tests: Test[],
  testAdmins: User[],
) {
  const assignmentRepository = dataSource.getRepository(Assignment);
  const packageRepository = dataSource.getRepository(Package);
  const packageTestRepository = dataSource.getRepository(PackageTest);

  const assignments: Assignment[] = [];

  for (const patient of patients) {
    // Get patient's package
    const patientPackage = await dataSource
      .getRepository(PatientPackage)
      .findOne({
        where: { patientId: patient.id },
        relations: ['package'],
      });

    if (!patientPackage) continue;

    // Get tests in package
    const packageTests = await packageTestRepository.find({
      where: { packageId: patientPackage.packageId },
    });

    for (const packageTest of packageTests) {
      const test = tests.find((t) => t.id === packageTest.testId);
      if (!test) continue;

      // Find appropriate admin
      const admin = testAdmins.find((a) => a.testTechnicianType === test.adminRole);
      if (!admin && test.adminRole !== 'lab') continue;

      let assignment = await assignmentRepository.findOne({
        where: { patientId: patient.id, testId: test.id },
      });

      if (!assignment) {
        assignment = assignmentRepository.create({
          patientId: patient.id,
          testId: test.id,
          adminId: admin?.id || null,
          status: AssignmentStatus.ASSIGNED,
          assignedAt: new Date(),
          assignedBy: admin?.id || null,
        });
        assignment = await assignmentRepository.save(assignment);
      }
      assignments.push(assignment);
    }
  }

  return assignments;
}

async function submitResults(
  dataSource: DataSource,
  assignments: Assignment[],
  testAdmins: User[],
) {
  const resultRepository = dataSource.getRepository(TestResult);
  const assignmentRepository = dataSource.getRepository(Assignment);
  const testRepository = dataSource.getRepository(Test);

  const results: TestResult[] = [];

  for (const assignment of assignments) {
    // Skip lab tests (handled separately)
    const test = await testRepository.findOne({ where: { id: assignment.testId } });
    if (test?.category === TestCategory.LAB) continue;

    const existingResult = await resultRepository.findOne({
      where: { assignmentId: assignment.id },
    });

    if (existingResult) continue;

    // Get admin for this test
    const admin = testAdmins.find((a) => a.testTechnicianType === test?.adminRole);
    if (!admin) continue;

    // Create result values based on test fields
    const resultValues: Record<string, any> = {};

    // Special handling for audiometry test - generate realistic hearing test values
    if (test?.adminRole === 'audiometry') {
      const frequencies = [125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000];
      // Generate values within normal range (20-30 dB) for demo
      frequencies.forEach((freq) => {
        resultValues[`right_${freq}`] = Math.floor(Math.random() * 11) + 20; // 20-30 dB
        resultValues[`left_${freq}`] = Math.floor(Math.random() * 11) + 20; // 20-30 dB
      });
    } else if (test?.testFields) {
      for (const field of test.testFields) {
        if (field.field_type === TestFieldType.NUMBER) {
          resultValues[field.field_name] = Math.floor(Math.random() * 20) + 10;
        } else if (field.field_type === TestFieldType.TEXT) {
          resultValues[field.field_name] = 'Normal findings';
        }
      }
    }

    const result = resultRepository.create({
      assignmentId: assignment.id,
      resultValues,
      notes: 'Test completed successfully',
      enteredBy: admin.id,
      enteredAt: new Date(),
      isVerified: false,
    });

    const savedResult = await resultRepository.save(result);

    // Update assignment status to SUBMITTED
    assignment.status = AssignmentStatus.SUBMITTED;
    assignment.completedAt = new Date();
    await assignmentRepository.save(assignment);

    results.push(savedResult);
  }

  return results;
}

async function createBloodSamples(
  dataSource: DataSource,
  patients: Patient[],
  labTechnicianId: string,
) {
  const bloodSampleRepository = dataSource.getRepository(BloodSample);
  const assignmentRepository = dataSource.getRepository(Assignment);
  const testRepository = dataSource.getRepository(Test);

  // Find blood test
  const bloodTest = await testRepository.findOne({
    where: { category: TestCategory.LAB },
  });

  if (!bloodTest) {
    console.log('  Warning: No blood test found, skipping blood samples');
    return [];
  }

  const bloodSamples: BloodSample[] = [];

  for (const patient of patients) {
    // Find blood test assignment
    const assignment = await assignmentRepository.findOne({
      where: { patientId: patient.id, testId: bloodTest.id },
    });

    if (!assignment) continue;

    let bloodSample = await bloodSampleRepository.findOne({
      where: { patientId: patient.id },
    });

    if (!bloodSample) {
      // Generate sample ID
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const prefix = `BL-${dateStr}-`;
      const samplesToday = await bloodSampleRepository
        .createQueryBuilder('sample')
        .where('sample.sampleId LIKE :prefix', { prefix: `${prefix}%` })
        .orderBy('sample.sampleId', 'DESC')
        .getMany();

      let nextNumber = 1;
      if (samplesToday.length > 0) {
        const lastSampleId = samplesToday[0].sampleId;
        const lastNumberStr = lastSampleId.split('-')[2];
        const lastNumber = parseInt(lastNumberStr, 10);
        nextNumber = lastNumber + 1;
      }
      const sampleId = `${prefix}${nextNumber.toString().padStart(4, '0')}`;

      bloodSample = bloodSampleRepository.create({
        sampleId,
        patientId: patient.id,
        assignmentId: assignment.id,
        status: BloodSampleStatus.COMPLETED,
        collectedAt: new Date(),
        testedAt: new Date(),
        collectedBy: labTechnicianId,
        testedBy: labTechnicianId,
        passcodeHash: await bcrypt.hash('1234', 10), // Test passcode: 1234
      });
      bloodSample = await bloodSampleRepository.save(bloodSample);

      // Create result for blood test
      const resultRepository = dataSource.getRepository(TestResult);
      const existingResult = await resultRepository.findOne({
        where: { assignmentId: assignment.id },
      });

      if (!existingResult) {
        const resultValues: Record<string, any> = {};
        if (bloodTest.testFields) {
          for (const field of bloodTest.testFields) {
            if (field.field_type === TestFieldType.NUMBER) {
              resultValues[field.field_name] = Math.floor(Math.random() * 5) + 12;
            }
          }
        }

        const result = resultRepository.create({
          assignmentId: assignment.id,
          resultValues,
          notes: 'Blood test completed',
          enteredBy: labTechnicianId,
          enteredAt: new Date(),
          isVerified: false,
        });
        await resultRepository.save(result);

        // Update assignment status
        assignment.status = AssignmentStatus.SUBMITTED;
        assignment.completedAt = new Date();
        await assignmentRepository.save(assignment);
      }
    }

    bloodSamples.push(bloodSample);
  }

  return bloodSamples;
}

async function createDoctorReviews(
  dataSource: DataSource,
  patients: Patient[],
  doctorId: string,
) {
  const reviewRepository = dataSource.getRepository(DoctorReview);
  const assignmentRepository = dataSource.getRepository(Assignment);
  const reportsRepository = dataSource.getRepository(Report);

  const reviews: DoctorReview[] = [];

  for (const patient of patients) {
    // Check if all assignments are SUBMITTED
    const assignments = await assignmentRepository.find({
      where: { patientId: patient.id },
    });

    const allSubmitted = assignments.every(
      (a) => a.status === AssignmentStatus.SUBMITTED,
    );

    if (!allSubmitted || assignments.length === 0) continue;

    let review = await reviewRepository.findOne({
      where: { patientId: patient.id, doctorId },
    });

    if (!review) {
      review = reviewRepository.create({
        patientId: patient.id,
        doctorId,
        remarks: 'All test results are within normal range. Patient is healthy.',
        reviewedAt: new Date(),
        signedAt: new Date(),
        isSigned: true,
        passkeyVerified: true, // For testing purposes
      });
      review = await reviewRepository.save(review);
    } else {
      // Ensure it's signed
      if (!review.isSigned) {
        review.isSigned = true;
        review.signedAt = new Date();
        review.passkeyVerified = true;
        review = await reviewRepository.save(review);
      }
    }

    reviews.push(review);

    // Auto-generate report after signing
    try {
      const existingReport = await reportsRepository.findOne({
        where: { patientId: patient.id },
      });

      if (!existingReport) {
        // Generate report number
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        const prefix = `RPT-${dateStr}-`;
        const existingReports = await reportsRepository
          .createQueryBuilder('report')
          .where('report.reportNumber LIKE :prefix', { prefix: `${prefix}%` })
          .orderBy('report.reportNumber', 'DESC')
          .getMany();

        let sequence = 1;
        if (existingReports.length > 0) {
          const lastReportNumber = existingReports[0].reportNumber;
          const lastSequenceStr = lastReportNumber.split('-')[2];
          const lastSequence = parseInt(lastSequenceStr, 10);
          if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
          }
        }
        const reportNumber = `${prefix}${sequence.toString().padStart(4, '0')}`;

        // Create report record (status will be set to COMPLETED when PDF is generated)
        const report = reportsRepository.create({
          patientId: patient.id,
          reportNumber,
          doctorReviewId: review.id,
          status: ReportStatus.PENDING,
          generatedBy: doctorId,
        });
        await reportsRepository.save(report);
      }
    } catch (error) {
      console.log(`Note: Could not auto-generate report for patient ${patient.id}: ${error.message}`);
    }
  }

  return reviews;
}

seedAll();

