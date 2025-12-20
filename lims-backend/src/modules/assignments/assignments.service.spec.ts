import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { Assignment } from './entities/assignment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { PatientPackage } from '../patients/entities/patient-package.entity';
import { Test as TestEntity } from '../tests/entities/test.entity';
import { Package } from '../packages/entities/package.entity';
import { PackageTest } from '../packages/entities/package-test.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { AdminSelectionService } from './services/admin-selection.service';
import { AuditService } from '../audit/audit.service';
import { ProjectAccessService } from '../../common/services/project-access.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ReassignAssignmentDto } from './dto/reassign-assignment.dto';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';
import { AssignmentStatus } from './constants/assignment-status.enum';
import { PaymentStatus } from '../patients/constants/payment-status.enum';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let assignmentsRepository: Repository<Assignment>;
  let patientsRepository: Repository<Patient>;
  let patientPackagesRepository: Repository<PatientPackage>;
  let testsRepository: Repository<TestEntity>;
  let packagesRepository: Repository<Package>;
  let packageTestsRepository: Repository<PackageTest>;
  let usersRepository: Repository<User>;
  let adminSelectionService: AdminSelectionService;
  let auditService: AuditService;

  const mockPatient: Patient = {
    id: 'patient-1',
    patientId: 'PAT-20240101-0001',
    barcodeNumber: '1234567890',
    name: 'John Doe',
    age: 30,
    gender: 'MALE' as any,
    contactNumber: '+1234567890',
    email: null,
    employeeId: null,
    companyName: null,
    address: null,
    projectId: null,
    project: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    patientPackages: [],
  };

  const mockPatientPackage: PatientPackage = {
    id: 'pp-1',
    patientId: 'patient-1',
    packageId: 'package-1',
    addonTestIds: ['test-2'],
    totalPrice: 1000,
    paymentStatus: PaymentStatus.PENDING,
    paymentAmount: 0,
    registeredBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: mockPatient,
    package: null,
    registeredByUser: null,
  };

  const mockTest1: TestEntity = {
    id: 'test-1',
    name: 'Audiometry Test',
    description: 'Test',
    category: 'on_site' as any,
    adminRole: 'audiometry',
    normalRangeMin: null,
    normalRangeMax: null,
    unit: null,
    testFields: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    packageTests: [],
  };

  const mockTest2: TestEntity = {
    id: 'test-2',
    name: 'X-Ray Test',
    description: 'Test',
    category: 'lab' as any,
    adminRole: 'xray',
    normalRangeMin: null,
    normalRangeMax: null,
    unit: null,
    testFields: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    packageTests: [],
  };

  const mockAdmin: User = {
    id: 'admin-1',
    email: 'admin@lims.com',
    passwordHash: 'hash',
    fullName: 'Test Admin',
    role: UserRole.TEST_TECHNICIAN,
    testTechnicianType: 'audiometry',
    isActive: true,
    passkeyCredentialId: null,
    passkeyPublicKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAssignment: Assignment = {
    id: 'assignment-1',
    patientId: 'patient-1',
    testId: 'test-1',
    adminId: 'admin-1',
    status: AssignmentStatus.ASSIGNED,
    assignedAt: new Date(),
    startedAt: null,
    completedAt: null,
    assignedBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: mockPatient,
    test: mockTest1,
    admin: mockAdmin,
    assignedByUser: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: getRepositoryToken(Assignment),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockAssignment]),
              getCount: jest.fn().mockResolvedValue(1),
            })),
          },
        },
        {
          provide: getRepositoryToken(Patient),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PatientPackage),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TestEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Package),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PackageTest),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: AdminSelectionService,
          useValue: {
            findAvailableAdmin: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: ProjectAccessService,
          useValue: {
            canAccessProject: jest.fn().mockResolvedValue(true),
            getUserProjectIds: jest.fn().mockResolvedValue(['project-1']),
          },
        },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
    assignmentsRepository = module.get<Repository<Assignment>>(getRepositoryToken(Assignment));
    patientsRepository = module.get<Repository<Patient>>(getRepositoryToken(Patient));
    patientPackagesRepository = module.get<Repository<PatientPackage>>(
      getRepositoryToken(PatientPackage),
    );
    testsRepository = module.get<Repository<TestEntity>>(getRepositoryToken(TestEntity));
    packagesRepository = module.get<Repository<Package>>(getRepositoryToken(Package));
    packageTestsRepository = module.get<Repository<PackageTest>>(
      getRepositoryToken(PackageTest),
    );
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    adminSelectionService = module.get<AdminSelectionService>(AdminSelectionService);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('autoAssign', () => {
    it('should create assignments for all tests in package and addons', async () => {
      jest.spyOn(patientsRepository, 'findOne').mockResolvedValue({
        ...mockPatient,
        patientPackages: [mockPatientPackage],
      } as Patient);
      jest.spyOn(packageTestsRepository, 'find').mockResolvedValue([
        { testId: 'test-1', packageId: 'package-1' } as PackageTest,
      ]);
      jest.spyOn(testsRepository, 'find').mockResolvedValue([mockTest1, mockTest2]);
      jest.spyOn(assignmentsRepository, 'find').mockResolvedValue([]);
      jest.spyOn(adminSelectionService, 'findAvailableAdmin').mockResolvedValue(mockAdmin);
      jest.spyOn(assignmentsRepository, 'create').mockReturnValue(mockAssignment);
      jest.spyOn(assignmentsRepository, 'save').mockResolvedValue(mockAssignment);

      const result = await service.autoAssign('patient-1', 'user-1');

      expect(result).toBeInstanceOf(Array);
      expect(assignmentsRepository.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if patient not found', async () => {
      jest.spyOn(patientsRepository, 'findOne').mockResolvedValue(null);

      await expect(service.autoAssign('invalid-patient', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should skip tests that already have assignments', async () => {
      jest.spyOn(patientsRepository, 'findOne').mockResolvedValue({
        ...mockPatient,
        patientPackages: [mockPatientPackage],
      } as Patient);
      jest.spyOn(packageTestsRepository, 'find').mockResolvedValue([
        { testId: 'test-1', packageId: 'package-1' } as PackageTest,
      ]);
      jest.spyOn(testsRepository, 'find').mockResolvedValue([mockTest1]);
      jest.spyOn(assignmentsRepository, 'find').mockResolvedValue([
        { testId: 'test-1' } as Assignment,
      ]);

      const result = await service.autoAssign('patient-1', 'user-1');

      expect(result).toEqual([]); // No new assignments created
    });
  });

  describe('manualAssign', () => {
    it('should create assignment manually', async () => {
      const dto: CreateAssignmentDto = {
        patientId: 'patient-1',
        testId: 'test-1',
        adminId: 'admin-1',
      };

      jest.spyOn(patientsRepository, 'findOne').mockResolvedValue({
        ...mockPatient,
        patientPackages: [mockPatientPackage],
      } as Patient);
      jest.spyOn(testsRepository, 'findOne').mockResolvedValue(mockTest1);
      jest.spyOn(packageTestsRepository, 'find').mockResolvedValue([
        { testId: 'test-1', packageId: 'package-1' } as PackageTest,
      ]);
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockAdmin);
      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(assignmentsRepository, 'create').mockReturnValue(mockAssignment);
      jest.spyOn(assignmentsRepository, 'save').mockResolvedValue(mockAssignment);

      const result = await service.manualAssign(dto, 'user-1');

      expect(result).toBeDefined();
      expect(assignmentsRepository.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if test not in patient package', async () => {
      const dto: CreateAssignmentDto = {
        patientId: 'patient-1',
        testId: 'test-999',
        adminId: 'admin-1',
      };

      jest.spyOn(patientsRepository, 'findOne').mockResolvedValue({
        ...mockPatient,
        patientPackages: [mockPatientPackage],
      } as Patient);
      jest.spyOn(testsRepository, 'findOne').mockResolvedValue(mockTest1);
      jest.spyOn(packageTestsRepository, 'find').mockResolvedValue([]);

      await expect(service.manualAssign(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reassign', () => {
    it('should reassign assignment to new admin', async () => {
      const dto: ReassignAssignmentDto = { adminId: 'admin-2' };
      const newAdmin: User = { ...mockAdmin, id: 'admin-2' };

      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue({
        ...mockAssignment,
        test: mockTest1,
      } as Assignment);
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(newAdmin);
      jest.spyOn(assignmentsRepository, 'save').mockResolvedValue({
        ...mockAssignment,
        adminId: 'admin-2',
      } as Assignment);

      const result = await service.reassign('assignment-1', dto, 'user-1');

      expect(result.adminId).toBe('admin-2');
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException if admin testTechnicianType does not match', async () => {
      const dto: ReassignAssignmentDto = { adminId: 'admin-2' };
      const wrongAdmin: User = { ...mockAdmin, id: 'admin-2', testTechnicianType: 'xray' };

      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue({
        ...mockAssignment,
        test: mockTest1,
      } as Assignment);
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(wrongAdmin);

      await expect(service.reassign('assignment-1', dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update status from ASSIGNED to IN_PROGRESS', async () => {
      const dto: UpdateAssignmentStatusDto = { status: AssignmentStatus.IN_PROGRESS };

      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(mockAssignment);
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockAdmin);
      jest.spyOn(assignmentsRepository, 'save').mockResolvedValue({
        ...mockAssignment,
        status: AssignmentStatus.IN_PROGRESS,
        startedAt: new Date(),
      } as Assignment);

      const result = await service.updateStatus('assignment-1', dto, 'admin-1');

      expect(result.status).toBe(AssignmentStatus.IN_PROGRESS);
      expect(result.startedAt).toBeDefined();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const dto: UpdateAssignmentStatusDto = { status: AssignmentStatus.SUBMITTED };

      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(mockAssignment);
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockAdmin);

      await expect(service.updateStatus('assignment-1', dto, 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException if user tries to update someone else assignment', async () => {
      const dto: UpdateAssignmentStatusDto = { status: AssignmentStatus.IN_PROGRESS };
      const otherUser: User = { ...mockAdmin, id: 'admin-2' };

      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(mockAssignment);
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(otherUser);

      await expect(service.updateStatus('assignment-1', dto, 'admin-2')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findByPatient', () => {
    it('should return assignments for patient', async () => {
      jest.spyOn(assignmentsRepository, 'find').mockResolvedValue([mockAssignment]);

      const result = await service.findByPatient('patient-1');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
    });
  });

  describe('findByAdmin', () => {
    it('should return assignments for admin', async () => {
      jest.spyOn(assignmentsRepository, 'find').mockResolvedValue([mockAssignment]);

      const result = await service.findByAdmin('admin-1');

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return assignment by id', async () => {
      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(mockAssignment);

      const result = await service.findById('assignment-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('assignment-1');
    });

    it('should throw NotFoundException if assignment not found', async () => {
      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});

