import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { UserRole } from '../src/modules/users/entities/user.entity';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let superAdminToken: string;
  let regularUserToken: string;
  let regularUserId: string;
  let createdUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login as super admin (from seed)
    const superAdminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@lims.com',
        password: 'Admin@123',
      });

    superAdminToken = superAdminLogin.body.accessToken;

    // Create a regular user for testing
    const createUserResponse = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: 'regular@example.com',
        password: 'RegularPass123!',
        fullName: 'Regular User',
        role: UserRole.DOCTOR,
      });

    regularUserId = createUserResponse.body.id;

    // Login as regular user
    const regularUserLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'regular@example.com',
        password: 'RegularPass123!',
      });

    regularUserToken = regularUserLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should return 403 for non-SUPER_ADMIN users', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          email: 'test@example.com',
          password: 'TestPass123!',
          fullName: 'Test User',
          role: UserRole.RECEPTIONIST,
        })
        .expect(403);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!',
          fullName: 'Test User',
          role: UserRole.RECEPTIONIST,
        })
        .expect(401);
    });

    it('should create a new user as SUPER_ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'NewUser123!',
          fullName: 'New User',
          role: UserRole.RECEPTIONIST,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'newuser@example.com');
      expect(response.body).toHaveProperty('fullName', 'New User');
      expect(response.body).toHaveProperty('role', UserRole.RECEPTIONIST);
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('password');

      createdUserId = response.body.id;
    });

    it('should return 400 if test_technician_type is missing for TEST_TECHNICIAN role', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'testadmin@example.com',
          password: 'TestAdmin123!',
          fullName: 'Test Admin',
          role: UserRole.TEST_TECHNICIAN,
        })
        .expect(400);
    });

    it('should create TEST_TECHNICIAN user with test_technician_type', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'testadmin@example.com',
          password: 'TestAdmin123!',
          fullName: 'Test Admin',
          role: UserRole.TEST_TECHNICIAN,
          testTechnicianType: 'audiometry',
        })
        .expect(201);

      expect(response.body.role).toBe(UserRole.TEST_TECHNICIAN);
      expect(response.body.testTechnicianType).toBe('audiometry');
    });

    it('should return 409 if email already exists', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'regular@example.com',
          password: 'AnotherPass123!',
          fullName: 'Another User',
          role: UserRole.RECEPTIONIST,
        })
        .expect(409);
    });

    it('should return 400 for invalid password', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'weak@example.com',
          password: 'weak',
          fullName: 'Weak User',
          role: UserRole.RECEPTIONIST,
        })
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should return 403 for non-SUPER_ADMIN users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/users').expect(401);
    });

    it('should return paginated users list', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data)).toBe(true);
      response.body.data.forEach((user: any) => {
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should support pagination query params', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?page=1&limit=5')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.limit).toBe(5);
    });

    it('should filter by role', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?role=DOCTOR')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      response.body.data.forEach((user: any) => {
        expect(user.role).toBe(UserRole.DOCTOR);
      });
    });

    it('should search by email or name', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?search=regular')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      const found = response.body.data.some(
        (user: any) =>
          user.email.includes('regular') || user.fullName.includes('regular'),
      );
      expect(found).toBe(true);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get(`/users/${regularUserId}`).expect(401);
    });

    it('should return user when SUPER_ADMIN accesses any user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', regularUserId);
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return user when accessing own profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', regularUserId);
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return 403 when accessing another user profile', () => {
      return request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('should return 403 when user not found', () => {
      return request(app.getHttpServer())
        .get('/users/invalid-id')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(403);
    });
  });

  describe('/users/:id (PUT)', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .put(`/users/${regularUserId}`)
        .send({ fullName: 'Updated Name' })
        .expect(401);
    });

    it('should update user when SUPER_ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .put(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          fullName: 'Updated Name',
          role: UserRole.LAB_TECHNICIAN,
        })
        .expect(200);

      expect(response.body.fullName).toBe('Updated Name');
      expect(response.body.role).toBe(UserRole.LAB_TECHNICIAN);
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should update limited fields when non-SUPER_ADMIN updates own profile', async () => {
      const response = await request(app.getHttpServer())
        .put(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          fullName: 'My Updated Name',
          role: UserRole.SUPER_ADMIN, // Should be ignored
          isActive: false, // Should be ignored
        })
        .expect(200);

      expect(response.body.fullName).toBe('My Updated Name');
      // Role should not change (restricted field)
      expect(response.body.role).toBe(UserRole.LAB_TECHNICIAN);
    });

    it('should return 403 when updating another user profile', () => {
      return request(app.getHttpServer())
        .put(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ fullName: 'Updated Name' })
        .expect(403);
    });

    it('should return 409 if email already exists', () => {
      return request(app.getHttpServer())
        .put(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'admin@lims.com',
        })
        .expect(409);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should return 403 for non-SUPER_ADMIN users', () => {
      return request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .expect(401);
    });

    it('should soft delete user', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toEqual({ message: 'User deleted successfully' });

      // Verify user is soft deleted (isActive = false)
      const getUserResponse = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(getUserResponse.body.isActive).toBe(false);
    });

    it('should return 400 when trying to delete own account', () => {
      return request(app.getHttpServer())
        .delete(`/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(400);
    });
  });

  describe('/users/:id/change-password (POST)', () => {
    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .post(`/users/${regularUserId}/change-password`)
        .send({
          currentPassword: 'RegularPass123!',
          newPassword: 'NewPass123!',
        })
        .expect(401);
    });

    it('should change password when user changes own password', async () => {
      const response = await request(app.getHttpServer())
        .post(`/users/${regularUserId}/change-password`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          currentPassword: 'RegularPass123!',
          newPassword: 'NewSecurePass123!',
        })
        .expect(200);

      expect(response.body).toEqual({ message: 'Password changed successfully' });

      // Verify new password works
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'regular@example.com',
          password: 'NewSecurePass123!',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
    });

    it('should return 400 for invalid current password', () => {
      return request(app.getHttpServer())
        .post(`/users/${regularUserId}/change-password`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPass123!',
        })
        .expect(400);
    });

    it('should change password when SUPER_ADMIN changes another user password', async () => {
      // Create a test user
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'changepass@example.com',
          password: 'InitialPass123!',
          fullName: 'Change Pass User',
          role: UserRole.RECEPTIONIST,
        })
        .expect(201);

      const testUserId = createResponse.body.id;

      // SUPER_ADMIN changes password without current password
      const changeResponse = await request(app.getHttpServer())
        .post(`/users/${testUserId}/change-password`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          currentPassword: 'InitialPass123!',
          newPassword: 'SuperAdminChanged123!',
        })
        .expect(200);

      expect(changeResponse.body).toEqual({ message: 'Password changed successfully' });

      // Verify new password works
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'changepass@example.com',
          password: 'SuperAdminChanged123!',
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
    });

    it('should return 403 when changing another user password', () => {
      return request(app.getHttpServer())
        .post(`/users/${createdUserId}/change-password`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          currentPassword: 'SomePass123!',
          newPassword: 'NewPass123!',
        })
        .expect(403);
    });

    it('should return 400 for weak new password', () => {
      return request(app.getHttpServer())
        .post(`/users/${regularUserId}/change-password`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          currentPassword: 'NewSecurePass123!',
          newPassword: 'weak',
        })
        .expect(400);
    });
  });
});

