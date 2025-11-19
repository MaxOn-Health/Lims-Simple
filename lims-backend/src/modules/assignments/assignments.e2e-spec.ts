import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { AssignmentStatus } from './constants/assignment-status.enum';

describe('AssignmentsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let patientId: string;
  let testId: string;
  let adminUserId: string;
  let assignmentId: string;

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
        testFields: [{ field_name: 'Result', field_type: 'number', required: true, options: null }],
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
  });

  afterAll(async () => {
    // Clean up
    if (assignmentId) {
      await request(app.getHttpServer())
        .delete(`/assignments/${assignmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .catch(() => {}); // Ignore errors
    }

    await request(app.getHttpServer())
      .delete(`/users/${adminUserId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .catch(() => {});

    await app.close();
  });

  it('/assignments/auto-assign/:patientId (POST) - should auto-assign tests', async () => {
    const res = await request(app.getHttpServer())
      .post(`/assignments/auto-assign/${patientId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('patientId', patientId);
    expect(res.body[0]).toHaveProperty('testId');
    expect(res.body[0].status).toMatch(/ASSIGNED|PENDING/);

    assignmentId = res.body[0].id;
  });

  it('/assignments/patient/:patientId (GET) - should get assignments for patient', async () => {
    const res = await request(app.getHttpServer())
      .get(`/assignments/patient/${patientId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].patientId).toBe(patientId);
  });

  it('/assignments/:id (GET) - should get assignment by ID', async () => {
    const res = await request(app.getHttpServer())
      .get(`/assignments/${assignmentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.id).toBe(assignmentId);
    expect(res.body.patientId).toBe(patientId);
  });

  it('/assignments/my-assignments (GET) - should get assignments for current admin', async () => {
    // First, manually assign to the test admin
    await request(app.getHttpServer())
      .post('/assignments/manual-assign')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: patientId,
        testId: testId,
        adminId: adminUserId,
      });

    const res = await request(app.getHttpServer())
      .get('/assignments/my-assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('/assignments/:id/status (PUT) - should update assignment status', async () => {
    // Get an assignment assigned to the admin
    const assignmentsRes = await request(app.getHttpServer())
      .get('/assignments/my-assignments')
      .set('Authorization', `Bearer ${adminToken}`);

    if (assignmentsRes.body.length > 0) {
      const testAssignmentId = assignmentsRes.body[0].id;

      // Update to IN_PROGRESS
      const updateRes = await request(app.getHttpServer())
        .put(`/assignments/${testAssignmentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: AssignmentStatus.IN_PROGRESS,
        })
        .expect(200);

      expect(updateRes.body.status).toBe(AssignmentStatus.IN_PROGRESS);
      expect(updateRes.body.startedAt).toBeDefined();
    }
  });

  it('/assignments/:id/reassign (PUT) - should reassign assignment', async () => {
    const reassignRes = await request(app.getHttpServer())
      .put(`/assignments/${assignmentId}/reassign`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        adminId: adminUserId,
      })
      .expect(200);

    expect(reassignRes.body.adminId).toBe(adminUserId);
    expect(reassignRes.body.status).toBe(AssignmentStatus.ASSIGNED);
  });

  it('/assignments/manual-assign (POST) - should manually assign test', async () => {
    const manualAssignRes = await request(app.getHttpServer())
      .post('/assignments/manual-assign')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        patientId: patientId,
        testId: testId,
        adminId: adminUserId,
      })
      .expect(201);

    expect(manualAssignRes.body).toHaveProperty('id');
    expect(manualAssignRes.body.patientId).toBe(patientId);
    expect(manualAssignRes.body.testId).toBe(testId);
    expect(manualAssignRes.body.adminId).toBe(adminUserId);
  });
});

