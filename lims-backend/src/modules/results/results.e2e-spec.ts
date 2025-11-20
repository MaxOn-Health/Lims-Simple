import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { AssignmentStatus } from '../assignments/constants/assignment-status.enum';

describe('ResultsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let patientId: string;
  let testId: string;
  let adminUserId: string;
  let assignmentId: string;
  let resultId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    // Admin login to get token
    const loginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@lims.com',
      password: 'Admin@123',
    });
    authToken = loginRes.body.accessToken;

    // Create a test admin user
    const createAdminRes = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        email: 'testadmin@lims.com',
        password: 'Test@123',
        fullName: 'Test Admin',
        role: 'TEST_TECHNICIAN',
        testTechnicianType: 'audiometry',
      });
    adminUserId = createAdminRes.body.id;

    // Login as test admin
    const adminLoginRes = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'testadmin@lims.com',
      password: 'Test@123',
    });
    adminToken = adminLoginRes.body.accessToken;

    // Create a test
    const testRes = await request(app.getHttpServer())
      .post('/tests')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Audiometry Test',
        description: 'Audiometry test for E2E',
        category: 'on_site',
        adminRole: 'audiometry',
        testFields: [
          {
            field_name: 'result_value',
            field_type: 'number',
            required: true,
            options: null,
          },
          {
            field_name: 'notes',
            field_type: 'text',
            required: false,
            options: null,
          },
        ],
        normalRangeMin: 5.0,
        normalRangeMax: 15.0,
      });
    testId = testRes.body.id;

    // Create a package
    const packageRes = await request(app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Health Package',
        description: 'A package for E2E tests',
        price: 1500.0,
        validityDays: 365,
      });
    const packageId = packageRes.body.id;

    // Add test to package
    await request(app.getHttpServer())
      .post(`/packages/${packageId}/tests`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        testId: testId,
        testPrice: 500.0,
      });

    // Register a patient
    const patientRes = await request(app.getHttpServer())
      .post('/patients/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test Patient',
        age: 30,
        gender: 'MALE',
        contactNumber: '+1234567890',
        packageId: packageId,
      });
    patientId = patientRes.body.id;

    // Auto-assign tests
    const assignRes = await request(app.getHttpServer())
      .post(`/assignments/auto-assign/${patientId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);
    assignmentId = assignRes.body[0].id;

    // Manually assign to test admin
    await request(app.getHttpServer())
      .post('/assignments/manual-assign')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: patientId,
        testId: testId,
        adminId: adminUserId,
      });

    // Update assignment status to IN_PROGRESS so technician can record results
    await request(app.getHttpServer())
      .put(`/assignments/${assignmentId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: AssignmentStatus.IN_PROGRESS,
      });
  });

  afterAll(async () => {
    // Clean up
    await request(app.getHttpServer())
      .delete(`/users/${adminUserId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .catch(() => {});

    await app.close();
  });

  it('/results/submit (POST) - should submit test result', async () => {
    const res = await request(app.getHttpServer())
      .post('/results/submit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignmentId: assignmentId,
        resultValues: {
          result_value: 10.5,
          notes: 'Patient fasting',
        },
        notes: 'E2E test result',
      })
      .expect(201);

    expect(res.body).toBeDefined();
    expect(res.body.id).toBeDefined();
    expect(res.body.assignmentId).toBe(assignmentId);
    expect(res.body.resultValues).toEqual({
      result_value: 10.5,
      notes: 'Patient fasting',
    });
    expect(res.body.enteredBy).toBe(adminUserId);

    resultId = res.body.id;
  });

  it('/results/submit (POST) - should return warning for value outside normal range', async () => {
    // Create another assignment and move it to IN_PROGRESS
    const assignRes = await request(app.getHttpServer())
      .post('/assignments/manual-assign')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: patientId,
        testId: testId,
        adminId: adminUserId,
      });
    const newAssignmentId = assignRes.body.id;

    await request(app.getHttpServer())
      .put(`/assignments/${newAssignmentId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: AssignmentStatus.IN_PROGRESS,
      });

    const res = await request(app.getHttpServer())
      .post('/results/submit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignmentId: newAssignmentId,
        resultValues: {
          result_value: 20.0, // Outside normal range 5.0-15.0
        },
      })
      .expect(201);

    expect(res.body.warnings).toBeDefined();
    expect(res.body.warnings.length).toBeGreaterThan(0);
    expect(res.body.warnings[0]).toContain('outside normal range');
  });

  it('/results/submit (POST) - should reject invalid result values', async () => {
    const assignRes = await request(app.getHttpServer())
      .post('/assignments/manual-assign')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: patientId,
        testId: testId,
        adminId: adminUserId,
      });
    const newAssignmentId = assignRes.body.id;

    await request(app.getHttpServer())
      .put(`/assignments/${newAssignmentId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: AssignmentStatus.IN_PROGRESS,
      });

    await request(app.getHttpServer())
      .post('/results/submit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignmentId: newAssignmentId,
        resultValues: {
          result_value: 'not a number', // Invalid type
        },
      })
      .expect(400);
  });

  it('/results/submit (POST) - should reject if assignment status is invalid', async () => {
    const assignRes = await request(app.getHttpServer())
      .post('/assignments/manual-assign')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: patientId,
        testId: testId,
        adminId: adminUserId,
      });
    const newAssignmentId = assignRes.body.id;

    // Force status to SUBMITTED, which should block new result entries
    await request(app.getHttpServer())
      .put(`/assignments/${newAssignmentId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: AssignmentStatus.SUBMITTED,
      });

    await request(app.getHttpServer())
      .post('/results/submit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignmentId: newAssignmentId,
        resultValues: {
          result_value: 10.5,
        },
      })
      .expect(400);
  });

  it('/results/assignment/:assignmentId (GET) - should get result by assignment', async () => {
    const res = await request(app.getHttpServer())
      .get(`/results/assignment/${assignmentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.id).toBe(resultId);
    expect(res.body.assignmentId).toBe(assignmentId);
  });

  it('/results/patient/:patientId (GET) - should get all results for patient', async () => {
    const res = await request(app.getHttpServer())
      .get(`/results/patient/${patientId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('/results/:id (PUT) - should update result as SUPER_ADMIN', async () => {
    const res = await request(app.getHttpServer())
      .put(`/results/${resultId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        resultValues: {
          result_value: 11.0,
          notes: 'Updated value',
        },
        notes: 'Updated after review',
      })
      .expect(200);

    expect(res.body.resultValues.result_value).toBe(11.0);
    expect(res.body.notes).toBe('Updated after review');
    expect(res.body.verifiedAt).toBeDefined();
  });

  it('/results/:id (PUT) - should reject update from non-SUPER_ADMIN', async () => {
    await request(app.getHttpServer())
      .put(`/results/${resultId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resultValues: {
          result_value: 12.0,
        },
      })
      .expect(403);
  });

  it('/results/:id/verify (POST) - should verify result as SUPER_ADMIN', async () => {
    const res = await request(app.getHttpServer())
      .post(`/results/${resultId}/verify`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.isVerified).toBe(true);
    expect(res.body.verifiedBy).toBeDefined();
    expect(res.body.verifiedAt).toBeDefined();
  });

  it('/results/:id/verify (POST) - should reject verification from non-SUPER_ADMIN', async () => {
    await request(app.getHttpServer())
      .post(`/results/${resultId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403);
  });
});




