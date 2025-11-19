import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { PatientPackage } from './entities/patient-package.entity';
import { Test as TestEntity } from '../tests/entities/test.entity';
import { Package } from '../packages/entities/package.entity';
import { PatientIdService } from './services/patient-id.service';
import { PriceCalculationService } from './services/price-calculation.service';
import { AuditService } from '../audit/audit.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Gender } from './constants/gender.enum';
import { PaymentStatus } from './constants/payment-status.enum';

describe('PatientsService', () => {
  let service: PatientsService;
  let patientsRepository: Repository<Patient>;
  let patientPackagesRepository: Repository<PatientPackage>;
  let testsRepository: Repository<TestEntity>;
  let packagesRepository: Repository<Package>;
  let patientIdService: PatientIdService;
  let priceCalculationService: PriceCalculationService;
  let auditService: AuditService;

  const mockPatient: Patient = {
    id: 'patient-1',
    patientId: 'PAT-20241110-0001',
    name: 'John Doe',
    age: 35,
    gender: Gender.MALE,
    contactNumber: '+1234567890',
    email: 'john@example.com',
    employeeId: 'EMP001',
    companyName: 'Acme Corp',
    address: '123 Main St',
    projectId: null,
    project: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    patientPackages: [],
  };

  const mockPackage: Package = {
    id: 'pkg-1',
    name: 'Test Package',
    description: 'Test',
    price: 1000.0,
    validityDays: 365,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    packageTests: [],
  };

  const mockPatientPackage: PatientPackage = {
    id: 'pp-1',
    patientId: 'patient-1',
    packageId: 'pkg-1',
    addonTestIds: [],
    totalPrice: 1000.0,
    paymentStatus: PaymentStatus.PENDING,
    paymentAmount: 0,
    registeredBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: mockPatient,
    package: mockPackage,
    registeredByUser: {} as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        {
          provide: getRepositoryToken(Patient),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PatientPackage),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TestEntity),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Package),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: PatientIdService,
          useValue: {
            generatePatientId: jest.fn(),
          },
        },
        {
          provide: PriceCalculationService,
          useValue: {
            calculateTotalPrice: jest.fn(),
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

    service = module.get<PatientsService>(PatientsService);
    patientsRepository = module.get<Repository<Patient>>(getRepositoryToken(Patient));
    patientPackagesRepository = module.get<Repository<PatientPackage>>(getRepositoryToken(PatientPackage));
    testsRepository = module.get<Repository<TestEntity>>(getRepositoryToken(TestEntity));
    packagesRepository = module.get<Repository<Package>>(getRepositoryToken(Package));
    patientIdService = module.get<PatientIdService>(PatientIdService);
    priceCalculationService = module.get<PriceCalculationService>(PriceCalculationService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const createDto: CreatePatientDto = {
      name: 'John Doe',
      age: 35,
      gender: Gender.MALE,
      contactNumber: '+1234567890',
      packageId: 'pkg-1',
    };

    it('should register a new patient', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(mockPackage);
      jest.spyOn(patientIdService, 'generatePatientId').mockResolvedValue('PAT-20241110-0001');
      jest.spyOn(priceCalculationService, 'calculateTotalPrice').mockResolvedValue(1000.0);
      jest.spyOn(patientsRepository, 'create').mockReturnValue(mockPatient);
      jest.spyOn(patientsRepository, 'save').mockResolvedValue(mockPatient);
      jest.spyOn(patientPackagesRepository, 'create').mockReturnValue(mockPatientPackage);
      jest.spyOn(patientPackagesRepository, 'save').mockResolvedValue(mockPatientPackage);
      jest.spyOn(auditService, 'log').mockResolvedValue({} as any);

      const result = await service.register(createDto, 'user-1');

      expect(result).toBeDefined();
      expect(result.patientId).toBe('PAT-20241110-0001');
      expect(patientIdService.generatePatientId).toHaveBeenCalled();
      expect(priceCalculationService.calculateTotalPrice).toHaveBeenCalledWith('pkg-1', []);
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException if package not found', async () => {
      jest.spyOn(packagesRepository, 'findOne').mockResolvedValue(null);

      await expect(service.register(createDto, 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return patient by ID', async () => {
      jest.spyOn(patientsRepository, 'findOne').mockResolvedValue(mockPatient);

      const result = await service.findById('patient-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('patient-1');
    });

    it('should throw NotFoundException if patient not found', async () => {
      jest.spyOn(patientsRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePayment', () => {
    it('should update payment status', async () => {
      const patientWithPackage = { ...mockPatient, patientPackages: [mockPatientPackage] };
      jest.spyOn(patientsRepository, 'findOne').mockResolvedValueOnce(patientWithPackage);
      jest.spyOn(patientPackagesRepository, 'update').mockResolvedValue(undefined as any);
      jest.spyOn(patientsRepository, 'findOne').mockResolvedValueOnce(patientWithPackage);
      jest.spyOn(auditService, 'log').mockResolvedValue({} as any);

      const updateDto: UpdatePaymentDto = {
        paymentStatus: PaymentStatus.PAID,
        paymentAmount: 1000.0,
      };

      const result = await service.updatePayment('patient-1', updateDto, 'user-1');

      expect(result).toBeDefined();
      expect(patientPackagesRepository.update).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException if payment amount exceeds total', async () => {
      const patientWithPackage = { ...mockPatient, patientPackages: [mockPatientPackage] };
      jest.spyOn(patientsRepository, 'findOne').mockResolvedValue(patientWithPackage);

      const updateDto: UpdatePaymentDto = {
        paymentStatus: PaymentStatus.PAID,
        paymentAmount: 2000.0, // Exceeds total
      };

      await expect(service.updatePayment('patient-1', updateDto, 'user-1')).rejects.toThrow(BadRequestException);
    });
  });
});

