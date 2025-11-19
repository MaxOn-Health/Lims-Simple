import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ReassignAssignmentDto } from './dto/reassign-assignment.dto';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';
import { AssignmentStatus } from './constants/assignment-status.enum';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

describe('AssignmentsController', () => {
  let controller: AssignmentsController;
  let service: AssignmentsService;

  const mockUser: JwtPayload = {
    userId: 'user-1',
    email: 'test@example.com',
    role: 'RECEPTIONIST',
  };

  const mockAssignmentResponse = {
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [
        {
          provide: AssignmentsService,
          useValue: {
            autoAssign: jest.fn(),
            manualAssign: jest.fn(),
            reassign: jest.fn(),
            updateStatus: jest.fn(),
            findByPatient: jest.fn(),
            findByAdmin: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AssignmentsController>(AssignmentsController);
    service = module.get<AssignmentsService>(AssignmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('autoAssign', () => {
    it('should auto-assign tests for patient', async () => {
      jest.spyOn(service, 'autoAssign').mockResolvedValue([mockAssignmentResponse as any]);

      const result = await controller.autoAssign('patient-1', mockUser);

      expect(result).toEqual([mockAssignmentResponse]);
      expect(service.autoAssign).toHaveBeenCalledWith('patient-1', mockUser.userId);
    });
  });

  describe('manualAssign', () => {
    it('should manually assign test', async () => {
      const dto: CreateAssignmentDto = {
        patientId: 'patient-1',
        testId: 'test-1',
        adminId: 'admin-1',
      };

      jest.spyOn(service, 'manualAssign').mockResolvedValue(mockAssignmentResponse as any);

      const result = await controller.manualAssign(dto, mockUser);

      expect(result).toEqual(mockAssignmentResponse);
      expect(service.manualAssign).toHaveBeenCalledWith(dto, mockUser.userId);
    });
  });

  describe('reassign', () => {
    it('should reassign assignment', async () => {
      const dto: ReassignAssignmentDto = { adminId: 'admin-2' };

      jest.spyOn(service, 'reassign').mockResolvedValue(mockAssignmentResponse as any);

      const result = await controller.reassign('assignment-1', dto, mockUser);

      expect(result).toEqual(mockAssignmentResponse);
      expect(service.reassign).toHaveBeenCalledWith('assignment-1', dto, mockUser.userId);
    });
  });

  describe('findByPatient', () => {
    it('should return assignments for patient', async () => {
      jest.spyOn(service, 'findByPatient').mockResolvedValue([mockAssignmentResponse as any]);

      const result = await controller.findByPatient('patient-1');

      expect(result).toEqual([mockAssignmentResponse]);
      expect(service.findByPatient).toHaveBeenCalledWith('patient-1');
    });
  });

  describe('getMyAssignments', () => {
    it('should return assignments for current user', async () => {
      const adminUser: JwtPayload = { userId: 'admin-1', email: 'admin@lims.com', role: 'TEST_TECHNICIAN' };
      jest.spyOn(service, 'findByAdmin').mockResolvedValue([mockAssignmentResponse as any]);

      const result = await controller.getMyAssignments(undefined, adminUser);

      expect(result).toEqual([mockAssignmentResponse]);
      expect(service.findByAdmin).toHaveBeenCalledWith(adminUser.userId, undefined);
    });

    it('should filter by status if provided', async () => {
      const adminUser: JwtPayload = { userId: 'admin-1', email: 'admin@lims.com', role: 'TEST_TECHNICIAN' };
      jest.spyOn(service, 'findByAdmin').mockResolvedValue([mockAssignmentResponse as any]);

      const result = await controller.getMyAssignments('ASSIGNED', adminUser);

      expect(result).toEqual([mockAssignmentResponse]);
      expect(service.findByAdmin).toHaveBeenCalledWith(adminUser.userId, AssignmentStatus.ASSIGNED);
    });
  });

  describe('updateStatus', () => {
    it('should update assignment status', async () => {
      const dto: UpdateAssignmentStatusDto = { status: AssignmentStatus.IN_PROGRESS };
      const adminUser: JwtPayload = { userId: 'admin-1', email: 'admin@lims.com', role: 'TEST_TECHNICIAN' };

      jest.spyOn(service, 'updateStatus').mockResolvedValue(mockAssignmentResponse as any);

      const result = await controller.updateStatus('assignment-1', dto, adminUser);

      expect(result).toEqual(mockAssignmentResponse);
      expect(service.updateStatus).toHaveBeenCalledWith('assignment-1', dto, adminUser.userId);
    });
  });

  describe('findById', () => {
    it('should return assignment by id', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(mockAssignmentResponse as any);

      const result = await controller.findById('assignment-1');

      expect(result).toEqual(mockAssignmentResponse);
      expect(service.findById).toHaveBeenCalledWith('assignment-1');
    });
  });
});

