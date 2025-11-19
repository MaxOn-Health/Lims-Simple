import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientIdService } from './patient-id.service';
import { Patient } from '../entities/patient.entity';

describe('PatientIdService', () => {
  let service: PatientIdService;
  let patientsRepository: Repository<Patient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientIdService,
        {
          provide: getRepositoryToken(Patient),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PatientIdService>(PatientIdService);
    patientsRepository = module.get<Repository<Patient>>(getRepositoryToken(Patient));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePatientId', () => {
    it('should generate patient ID in correct format', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(patientsRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(patientsRepository, 'findOne').mockResolvedValue(null);

      const patientId = await service.generatePatientId();

      expect(patientId).toMatch(/^PAT-\d{8}-\d{4}$/);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should increment sequence for same date', async () => {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const prefix = `PAT-${today}-`;

      const existingPatient: Patient = {
        id: 'test-id',
        patientId: `${prefix}0001`,
        name: 'Test',
        age: 30,
        gender: 'MALE' as any,
        contactNumber: '1234567890',
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

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([existingPatient]),
      };

      jest.spyOn(patientsRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(patientsRepository, 'findOne').mockResolvedValue(null);

      const patientId = await service.generatePatientId();

      expect(patientId).toBe(`${prefix}0002`);
    });

    it('should handle conflicts and retry', async () => {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const prefix = `PAT-${today}-`;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      const conflictingPatient: Patient = {
        id: 'test-id',
        patientId: `${prefix}0001`,
        name: 'Test',
        age: 30,
        gender: 'MALE' as any,
        contactNumber: '1234567890',
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

      jest.spyOn(patientsRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder as any);
      jest.spyOn(patientsRepository, 'findOne')
        .mockResolvedValueOnce(conflictingPatient) // First check finds conflict
        .mockResolvedValueOnce(null); // Second check passes

      const patientId = await service.generatePatientId();

      expect(patientId).toMatch(/^PAT-\d{8}-\d{4}$/);
      expect(patientsRepository.findOne).toHaveBeenCalledTimes(2);
    });
  });
});

