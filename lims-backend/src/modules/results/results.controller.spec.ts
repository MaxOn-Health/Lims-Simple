import { Test, TestingModule } from '@nestjs/testing';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { SubmitResultDto } from './dto/submit-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

describe('ResultsController', () => {
  let controller: ResultsController;
  let service: ResultsService;

  const mockUser: JwtPayload = {
    userId: 'admin-1',
    email: 'admin@lims.com',
    role: 'TEST_TECHNICIAN',
  };

  const mockSuperAdmin: JwtPayload = {
    userId: 'super-admin-1',
    email: 'superadmin@lims.com',
    role: 'SUPER_ADMIN',
  };

  const mockResultResponse = {
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResultsController],
      providers: [
        {
          provide: ResultsService,
          useValue: {
            submitResult: jest.fn(),
            findByAssignment: jest.fn(),
            findByPatient: jest.fn(),
            updateResult: jest.fn(),
            verifyResult: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ResultsController>(ResultsController);
    service = module.get<ResultsService>(ResultsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submitResult', () => {
    it('should submit result', async () => {
      const dto: SubmitResultDto = {
        assignmentId: 'assignment-1',
        resultValues: { result_value: 10.5 },
        notes: 'Patient fasting',
      };

      jest.spyOn(service, 'submitResult').mockResolvedValue(mockResultResponse as any);

      const result = await controller.submitResult(dto, mockUser);

      expect(result).toEqual(mockResultResponse);
      expect(service.submitResult).toHaveBeenCalledWith(dto, { id: mockUser.userId, role: mockUser.role });
    });
  });

  describe('findByAssignment', () => {
    it('should return result by assignment ID', async () => {
      jest.spyOn(service, 'findByAssignment').mockResolvedValue(mockResultResponse as any);

      const result = await controller.findByAssignment('assignment-1', mockUser);

      expect(result).toEqual(mockResultResponse);
      expect(service.findByAssignment).toHaveBeenCalledWith('assignment-1', { id: mockUser.userId, role: mockUser.role });
    });
  });

  describe('findByPatient', () => {
    it('should return results for patient', async () => {
      jest.spyOn(service, 'findByPatient').mockResolvedValue([mockResultResponse as any]);

      const result = await controller.findByPatient('patient-1', mockUser);

      expect(result).toEqual([mockResultResponse]);
      expect(service.findByPatient).toHaveBeenCalledWith('patient-1', { id: mockUser.userId, role: mockUser.role });
    });
  });

  describe('updateResult', () => {
    it('should update result', async () => {
      const dto: UpdateResultDto = {
        resultValues: { result_value: 11.0 },
        notes: 'Updated',
      };

      jest.spyOn(service, 'updateResult').mockResolvedValue(mockResultResponse as any);

      const result = await controller.updateResult('result-1', dto, mockSuperAdmin);

      expect(result).toEqual(mockResultResponse);
      expect(service.updateResult).toHaveBeenCalledWith('result-1', dto, mockSuperAdmin.userId);
    });
  });

  describe('verifyResult', () => {
    it('should verify result', async () => {
      jest.spyOn(service, 'verifyResult').mockResolvedValue(mockResultResponse as any);

      const result = await controller.verifyResult('result-1', mockSuperAdmin);

      expect(result).toEqual(mockResultResponse);
      expect(service.verifyResult).toHaveBeenCalledWith('result-1', mockSuperAdmin.userId);
    });
  });
});




