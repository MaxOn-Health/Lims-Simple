import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ResultsService } from './results.service';
import { TestResult } from './entities/test-result.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { AssignmentStatus } from '../assignments/constants/assignment-status.enum';
import { User, UserRole } from '../users/entities/user.entity';
import { ResultValidationService } from './services/result-validation.service';
import { AuditService } from '../audit/audit.service';
import { SubmitResultDto } from './dto/submit-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { Test as TestEntity, TestField } from '../tests/entities/test.entity';
import { TestFieldType } from '../tests/constants/test-field-types';
import { Patient } from '../patients/entities/patient.entity';

describe('ResultsService', () => {
  let service: ResultsService;
  let testResultsRepository: Repository<TestResult>;
  let assignmentsRepository: Repository<Assignment>;
  let usersRepository: Repository<User>;
  let resultValidationService: ResultValidationService;
  let auditService: AuditService;

  const mockTest: TestEntity = {
    id: 'test-1',
    name: 'Blood Glucose Test',
    description: 'Test',
    category: 'lab' as any,
    adminRole: 'lab_technician',
    normalRangeMin: 5.0,
    normalRangeMax: 15.0,
    unit: 'mg/dL',
    testFields: [
      {
        field_name: 'result_value',
        field_type: TestFieldType.NUMBER,
        required: true,
        options: null,
      },
    ] as TestField[],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    packageTests: [],
  };

  const mockPatient: Patient = {
    id: 'patient-1',
    patientId: 'PAT-20240101-0001',
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

  const mockAdmin: User = {
    id: 'admin-1',
    email: 'admin@lims.com',
    passwordHash: 'hash',
    fullName: 'Test Admin',
    role: UserRole.TEST_TECHNICIAN,
    testTechnicianType: 'lab_technician',
    isActive: true,
    passkeyCredentialId: null,
    passkeyPublicKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSuperAdmin: User = {
    id: 'super-admin-1',
    email: 'superadmin@lims.com',
    passwordHash: 'hash',
    fullName: 'Super Admin',
    role: UserRole.SUPER_ADMIN,
    testTechnicianType: null,
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
    status: AssignmentStatus.IN_PROGRESS,
    assignedAt: new Date(),
    startedAt: new Date(),
    completedAt: new Date(),
    assignedBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: mockPatient,
    test: mockTest,
    admin: mockAdmin,
    assignedByUser: null,
  };

  const mockTestResult: TestResult = {
    id: 'result-1',
    assignmentId: 'assignment-1',
    resultValues: { result_value: 10.5 },
    notes: 'Patient fasting',
    enteredBy: 'admin-1',
    enteredAt: new Date(),
    isVerified: false,
    verifiedBy: null,
    verifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignment: mockAssignment,
    enteredByUser: mockAdmin,
    verifiedByUser: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        {
          provide: getRepositoryToken(TestResult),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Assignment),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
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
          provide: ResultValidationService,
          useValue: {
            validateResultValues: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ResultsService>(ResultsService);
    testResultsRepository = module.get<Repository<TestResult>>(getRepositoryToken(TestResult));
    assignmentsRepository = module.get<Repository<Assignment>>(getRepositoryToken(Assignment));
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    resultValidationService = module.get<ResultValidationService>(ResultValidationService);
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitResult', () => {
    it('should submit result successfully', async () => {
      const dto: SubmitResultDto = {
        assignmentId: 'assignment-1',
        resultValues: { result_value: 10.5 },
        notes: 'Patient fasting',
      };

      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(mockAssignment);
      jest.spyOn(testResultsRepository, 'findOne')
        .mockResolvedValueOnce(null) // First call: check if result exists
        .mockResolvedValueOnce(mockTestResult); // Second call: get result with relations
      jest.spyOn(resultValidationService, 'validateResultValues').mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      jest.spyOn(testResultsRepository, 'create').mockReturnValue(mockTestResult);
      jest.spyOn(testResultsRepository, 'save').mockResolvedValue(mockTestResult);
      jest.spyOn(assignmentsRepository, 'save').mockResolvedValue(mockAssignment);

      const result = await service.submitResult(dto, 'admin-1');

      expect(result).toBeDefined();
      expect(assignmentsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AssignmentStatus.SUBMITTED }),
      );
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if assignment not found', async () => {
      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(null);

      const dto: SubmitResultDto = {
        assignmentId: 'non-existent',
        resultValues: { result_value: 10.5 },
      };

      await expect(service.submitResult(dto, 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if assignment does not belong to user', async () => {
      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(mockAssignment);

      const dto: SubmitResultDto = {
        assignmentId: 'assignment-1',
        resultValues: { result_value: 10.5 },
      };

      await expect(service.submitResult(dto, 'different-admin')).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if assignment status is not IN_PROGRESS or ASSIGNED', async () => {
      const invalidStatusAssignment = { ...mockAssignment, status: AssignmentStatus.SUBMITTED };
      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(invalidStatusAssignment);

      const dto: SubmitResultDto = {
        assignmentId: 'assignment-1',
        resultValues: { result_value: 10.5 },
      };

      await expect(service.submitResult(dto, 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if result already exists', async () => {
      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(mockAssignment);
      jest.spyOn(testResultsRepository, 'findOne').mockResolvedValue(mockTestResult);

      const dto: SubmitResultDto = {
        assignmentId: 'assignment-1',
        resultValues: { result_value: 10.5 },
      };

      await expect(service.submitResult(dto, 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if validation fails', async () => {
      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(mockAssignment);
      jest.spyOn(testResultsRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(resultValidationService, 'validateResultValues').mockReturnValue({
        isValid: false,
        errors: ['Required field missing'],
        warnings: [],
      });

      const dto: SubmitResultDto = {
        assignmentId: 'assignment-1',
        resultValues: {},
      };

      await expect(service.submitResult(dto, 'admin-1')).rejects.toThrow(BadRequestException);
    });

    it('should include warnings in response if validation has warnings', async () => {
      const dto: SubmitResultDto = {
        assignmentId: 'assignment-1',
        resultValues: { result_value: 20.0 }, // Outside normal range
      };

      // Create a fresh copy of the assignment to avoid mutation
      const freshAssignment = { ...mockAssignment, status: AssignmentStatus.IN_PROGRESS };
      jest.spyOn(assignmentsRepository, 'findOne').mockResolvedValue(freshAssignment);
      jest.spyOn(testResultsRepository, 'findOne')
        .mockResolvedValueOnce(null) // First call: check if result exists
        .mockResolvedValueOnce({ ...mockTestResult, assignment: freshAssignment }); // Second call: get result with relations
      jest.spyOn(resultValidationService, 'validateResultValues').mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['Value outside normal range'],
      });
      jest.spyOn(testResultsRepository, 'create').mockReturnValue(mockTestResult);
      jest.spyOn(testResultsRepository, 'save').mockResolvedValue(mockTestResult);
      jest.spyOn(assignmentsRepository, 'save').mockResolvedValue({ ...freshAssignment, status: AssignmentStatus.SUBMITTED });

      const result = await service.submitResult(dto, 'admin-1');

      expect(result.warnings).toEqual(['Value outside normal range']);
    });
  });

  describe('findByAssignment', () => {
    it('should return result by assignment ID', async () => {
      jest.spyOn(testResultsRepository, 'findOne').mockResolvedValue(mockTestResult);

      const result = await service.findByAssignment('assignment-1');

      expect(result).toBeDefined();
      expect(result.assignmentId).toBe('assignment-1');
    });

    it('should throw NotFoundException if result not found', async () => {
      jest.spyOn(testResultsRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findByAssignment('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByPatient', () => {
    it('should return results for patient', async () => {
      jest.spyOn(assignmentsRepository, 'find').mockResolvedValue([mockAssignment]);
      jest.spyOn(testResultsRepository, 'find').mockResolvedValue([mockTestResult]);

      const results = await service.findByPatient('patient-1');

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(1);
    });

    it('should return empty array if no assignments found', async () => {
      jest.spyOn(assignmentsRepository, 'find').mockResolvedValue([]);

      const results = await service.findByPatient('patient-1');

      expect(results).toEqual([]);
    });
  });

  describe('updateResult', () => {
    it('should update result as SUPER_ADMIN', async () => {
      const dto: UpdateResultDto = {
        resultValues: { result_value: 11.0 },
        notes: 'Updated',
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockSuperAdmin);
      jest.spyOn(testResultsRepository, 'findOne').mockResolvedValue(mockTestResult);
      jest.spyOn(resultValidationService, 'validateResultValues').mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      jest.spyOn(testResultsRepository, 'save').mockResolvedValue({
        ...mockTestResult,
        resultValues: { result_value: 11.0 },
        notes: 'Updated',
        verifiedAt: new Date(),
      });

      const result = await service.updateResult('result-1', dto, 'super-admin-1');

      expect(result).toBeDefined();
      expect(auditService.log).toHaveBeenCalledWith(
        'super-admin-1',
        'RESULT_UPDATED',
        'TestResult',
        'result-1',
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException if user is not SUPER_ADMIN', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockAdmin);

      const dto: UpdateResultDto = {
        resultValues: { result_value: 11.0 },
      };

      await expect(service.updateResult('result-1', dto, 'admin-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyResult', () => {
    it('should verify result as SUPER_ADMIN', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockSuperAdmin);
      jest.spyOn(testResultsRepository, 'findOne').mockResolvedValue(mockTestResult);
      jest.spyOn(testResultsRepository, 'save').mockResolvedValue({
        ...mockTestResult,
        isVerified: true,
        verifiedBy: 'super-admin-1',
        verifiedAt: new Date(),
      });

      const result = await service.verifyResult('result-1', 'super-admin-1');

      expect(result.isVerified).toBe(true);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not SUPER_ADMIN', async () => {
      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockAdmin);

      await expect(service.verifyResult('result-1', 'admin-1')).rejects.toThrow(ForbiddenException);
    });
  });
});

