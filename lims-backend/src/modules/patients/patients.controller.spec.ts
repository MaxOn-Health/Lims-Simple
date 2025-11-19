import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Gender } from './constants/gender.enum';
import { PaymentStatus } from './constants/payment-status.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

describe('PatientsController', () => {
  let controller: PatientsController;
  let service: PatientsService;

  const mockUser: JwtPayload = {
    userId: 'user-1',
    email: 'test@example.com',
    role: 'RECEPTIONIST',
  };

  const mockPatientResponse = {
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        {
          provide: PatientsService,
          useValue: {
            register: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByPatientId: jest.fn(),
            update: jest.fn(),
            updatePayment: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
    service = module.get<PatientsService>(PatientsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new patient', async () => {
      const createDto: CreatePatientDto = {
        name: 'John Doe',
        age: 35,
        gender: Gender.MALE,
        contactNumber: '+1234567890',
        packageId: 'pkg-1',
      };

      jest.spyOn(service, 'register').mockResolvedValue(mockPatientResponse as any);

      const result = await controller.register(createDto, mockUser);

      expect(result).toEqual(mockPatientResponse);
      expect(service.register).toHaveBeenCalledWith(createDto, mockUser.userId);
    });
  });

  describe('findAll', () => {
    it('should return paginated patients', async () => {
      const mockPaginatedResponse = {
        data: [mockPatientResponse],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockPaginatedResponse as any);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('findOne', () => {
    it('should return patient by ID', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockPatientResponse as any);

      const result = await controller.findOne('patient-1');

      expect(result).toEqual(mockPatientResponse);
      expect(service.findById).toHaveBeenCalledWith('patient-1');
    });
  });

  describe('findByPatientId', () => {
    it('should return patient by patient ID', async () => {
      jest.spyOn(service, 'findByPatientId').mockResolvedValue(mockPatientResponse as any);

      const result = await controller.findByPatientId('PAT-20241110-0001');

      expect(result).toEqual(mockPatientResponse);
      expect(service.findByPatientId).toHaveBeenCalledWith('PAT-20241110-0001');
    });
  });

  describe('update', () => {
    it('should update patient', async () => {
      const updateDto: UpdatePatientDto = {
        name: 'Jane Doe',
      };

      const updatedPatient = { ...mockPatientResponse, name: 'Jane Doe' };
      jest.spyOn(service, 'update').mockResolvedValue(updatedPatient as any);

      const result = await controller.update('patient-1', updateDto, mockUser);

      expect(result).toEqual(updatedPatient);
      expect(service.update).toHaveBeenCalledWith('patient-1', updateDto, mockUser.userId);
    });
  });

  describe('updatePayment', () => {
    it('should update payment status', async () => {
      const updatePaymentDto: UpdatePaymentDto = {
        paymentStatus: PaymentStatus.PAID,
        paymentAmount: 1000.0,
      };

      const updatedPatient = { ...mockPatientResponse };
      jest.spyOn(service, 'updatePayment').mockResolvedValue(updatedPatient as any);

      const result = await controller.updatePayment('patient-1', updatePaymentDto, mockUser);

      expect(result).toEqual(updatedPatient);
      expect(service.updatePayment).toHaveBeenCalledWith('patient-1', updatePaymentDto, mockUser.userId);
    });
  });
});

