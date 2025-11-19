import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { Gender } from './constants/gender.enum';
import { PaymentStatus } from './constants/payment-status.enum';

describe('PatientsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let packageId: string;
  let testId: string;
  let patientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@lims.com',
        password: 'Admin@123',
      });

    authToken = loginResponse.body.accessToken;

    // Create a package for testing
    const packageResponse = await request(app.getHttpServer())
      .post('/packages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test Package',
        price: 1500.0,
        validityDays: 365,
      });

    packageId = packageResponse.body.id;

    // Create a test for addon testing
    const testResponse = await request(app.getHttpServer())
      .post('/tests')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'E2E Test Test',
        category: 'lab',
        adminRole: 'audiometry',
        testFields: [
          {
            field_name: 'result',
            field_type: 'number',
            required: true,
            options: null,
          },
        ],
      });

    testId = testResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/patients/register (POST)', () => {
    it('should register a new patient', () => {
      return request(app.getHttpServer())
        .post('/patients/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Patient',
          age: 30,
          gender: Gender.MALE,
          contactNumber: '+1234567890',
          email: 'e2e@test.com',
          packageId: packageId,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('patientId');
          expect(res.body.patientId).toMatch(/^PAT-\d{8}-\d{4}$/);
          expect(res.body.name).toBe('E2E Test Patient');
          patientId = res.body.id;
        });
    });

    it('should register patient with addon tests', () => {
      return request(app.getHttpServer())
        .post('/patients/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Patient With Addons',
          age: 25,
          gender: Gender.FEMALE,
          contactNumber: '+9876543210',
          packageId: packageId,
          addonTestIds: [testId],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('patientId');
          expect(res.body.patientId).toMatch(/^PAT-\d{8}-\d{4}$/);
        });
    });

    it('should reject invalid gender', () => {
      return request(app.getHttpServer())
        .post('/patients/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Patient',
          age: 30,
          gender: 'INVALID',
          contactNumber: '+1234567890',
          packageId: packageId,
        })
        .expect(400);
    });

    it('should reject invalid package', () => {
      return request(app.getHttpServer())
        .post('/patients/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Package Patient',
          age: 30,
          gender: Gender.MALE,
          contactNumber: '+1234567890',
          packageId: 'non-existent-id',
        })
        .expect(404);
    });
  });

  describe('/patients (GET)', () => {
    it('should return paginated patients', () => {
      return request(app.getHttpServer())
        .get('/patients?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('page', 1);
          expect(res.body.meta).toHaveProperty('limit', 10);
        });
    });

    it('should search patients by name', () => {
      return request(app.getHttpServer())
        .get('/patients?search=E2E')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/patients/:id (GET)', () => {
    it('should return patient by ID', () => {
      return request(app.getHttpServer())
        .get(`/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', patientId);
          expect(res.body).toHaveProperty('patientPackages');
        });
    });

    it('should return 404 for non-existent patient', () => {
      return request(app.getHttpServer())
        .get('/patients/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/patients/by-patient-id/:patientId (GET)', () => {
    it('should return patient by patient ID', async () => {
      // First get a patient to know their patientId
      const patientsResponse = await request(app.getHttpServer())
        .get('/patients?limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      if (patientsResponse.body.data.length > 0) {
        const patientIdStr = patientsResponse.body.data[0].patientId;

        return request(app.getHttpServer())
          .get(`/patients/by-patient-id/${patientIdStr}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('patientId', patientIdStr);
          });
      }
    });
  });

  describe('/patients/:id (PUT)', () => {
    it('should update patient', () => {
      return request(app.getHttpServer())
        .put(`/patients/${patientId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated E2E Patient',
          age: 31,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated E2E Patient');
          expect(res.body.age).toBe(31);
        });
    });
  });

  describe('/patients/:id/payment (PUT)', () => {
    it('should update payment status', () => {
      return request(app.getHttpServer())
        .put(`/patients/${patientId}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentStatus: PaymentStatus.PARTIAL,
          paymentAmount: 500.0,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('patientPackages');
          if (res.body.patientPackages && res.body.patientPackages.length > 0) {
            expect(res.body.patientPackages[0].paymentStatus).toBe(PaymentStatus.PARTIAL);
            expect(parseFloat(res.body.patientPackages[0].paymentAmount)).toBe(500.0);
          }
        });
    });

    it('should reject payment amount exceeding total', () => {
      return request(app.getHttpServer())
        .put(`/patients/${patientId}/payment`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          paymentStatus: PaymentStatus.PAID,
          paymentAmount: 999999.0,
        })
        .expect(400);
    });
  });
});

