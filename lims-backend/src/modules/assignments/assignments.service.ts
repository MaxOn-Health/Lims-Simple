import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Assignment } from './entities/assignment.entity';
import { AssignmentStatus } from './constants/assignment-status.enum';
import { Patient } from '../patients/entities/patient.entity';
import { PatientPackage } from '../patients/entities/patient-package.entity';
import { Test } from '../tests/entities/test.entity';
import { Package } from '../packages/entities/package.entity';
import { PackageTest } from '../packages/entities/package-test.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { ReassignAssignmentDto } from './dto/reassign-assignment.dto';
import { UpdateAssignmentStatusDto } from './dto/update-assignment-status.dto';
import { QueryAssignmentsDto } from './dto/query-assignments.dto';
import { AssignmentResponseDto } from './dto/assignment-response.dto';
import { AdminSelectionService } from './services/admin-selection.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(PatientPackage)
    private patientPackagesRepository: Repository<PatientPackage>,
    @InjectRepository(Test)
    private testsRepository: Repository<Test>,
    @InjectRepository(Package)
    private packagesRepository: Repository<Package>,
    @InjectRepository(PackageTest)
    private packageTestsRepository: Repository<PackageTest>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private adminSelectionService: AdminSelectionService,
    private auditService: AuditService,
  ) {}

  async autoAssign(patientId: string, assignedByUserId: string): Promise<AssignmentResponseDto[]> {
    // Get patient with packages
    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      relations: ['patientPackages', 'patientPackages.package'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    if (!patient.patientPackages || patient.patientPackages.length === 0) {
      throw new BadRequestException('Patient has no package or tests assigned');
    }

    const patientPackage = patient.patientPackages[0]; // Assuming one package per patient for now

    // Get all tests from package (only if packageId exists)
    const packageTestIds: string[] = [];
    if (patientPackage.packageId) {
      const packageTests = await this.packageTestsRepository.find({
        where: { packageId: patientPackage.packageId },
        relations: ['test'],
      });
      packageTestIds.push(...packageTests.map((pt) => pt.testId));
    }

    // Get test IDs from PatientPackage (these are either addon tests when package exists, or standalone tests when no package)
    const testIds = patientPackage.addonTestIds || [];

    // Combine all test IDs
    const allTestIds = [...packageTestIds, ...testIds];

    if (allTestIds.length === 0) {
      throw new BadRequestException('No tests found for patient');
    }

    // Get all tests
    const tests = await this.testsRepository.find({
      where: { id: In(allTestIds), isActive: true },
    });

    // Get existing assignments for this patient to avoid duplicates
    const existingAssignments = await this.assignmentsRepository.find({
      where: { patientId },
    });
    const existingTestIds = new Set(existingAssignments.map((a) => a.testId));

    const createdAssignments: Assignment[] = [];

    // Create assignments for each test
    for (const test of tests) {
      // Skip if assignment already exists
      if (existingTestIds.has(test.id)) {
        continue;
      }

      // Find available admin
      const admin = await this.adminSelectionService.findAvailableAdmin(test.adminRole);

      const assignment = this.assignmentsRepository.create({
        patientId,
        testId: test.id,
        adminId: admin?.id || null,
        status: admin ? AssignmentStatus.ASSIGNED : AssignmentStatus.PENDING,
        assignedAt: admin ? new Date() : null,
        assignedBy: assignedByUserId,
      });

      const savedAssignment = await this.assignmentsRepository.save(assignment);
      createdAssignments.push(savedAssignment);

      // Log audit
      await this.auditService.log(
        assignedByUserId,
        'ASSIGNMENT_CREATED',
        'Assignment',
        savedAssignment.id,
        {
          patientId,
          testId: test.id,
          adminId: admin?.id || null,
          status: savedAssignment.status,
          autoAssigned: true,
        },
      );
    }

    return this.mapToResponseDtos(createdAssignments);
  }

  async manualAssign(
    dto: CreateAssignmentDto,
    assignedByUserId: string,
  ): Promise<AssignmentResponseDto> {
    // Validate patient exists
    const patient = await this.patientsRepository.findOne({
      where: { id: dto.patientId },
      relations: ['patientPackages', 'patientPackages.package'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${dto.patientId} not found`);
    }

    // Validate test exists and is active
    const test = await this.testsRepository.findOne({
      where: { id: dto.testId, isActive: true },
    });

    if (!test) {
      throw new NotFoundException(`Test with ID ${dto.testId} not found or not active`);
    }

    // Validate test is in patient's package or tests
    const patientPackage = patient.patientPackages?.[0];
    if (!patientPackage) {
      throw new BadRequestException('Patient has no package or tests assigned');
    }

    // Get package test IDs if package exists
    const packageTestIds: string[] = [];
    if (patientPackage.packageId) {
      const packageTests = await this.packageTestsRepository.find({
        where: { packageId: patientPackage.packageId },
      });
      packageTestIds.push(...packageTests.map((pt) => pt.testId));
    }

    // Get test IDs from PatientPackage (either addon tests with package, or standalone tests)
    const testIds = patientPackage.addonTestIds || [];
    const allTestIds = [...packageTestIds, ...testIds];

    if (!allTestIds.includes(dto.testId)) {
      throw new BadRequestException('Test is not in patient package or selected tests');
    }

    // Validate admin if provided
    let admin: User | null = null;
    if (dto.adminId) {
      admin = await this.usersRepository.findOne({
        where: { id: dto.adminId, isActive: true },
      });

      if (!admin) {
        throw new NotFoundException(`Admin with ID ${dto.adminId} not found or not active`);
      }

      if (admin.role !== UserRole.TEST_TECHNICIAN) {
        throw new BadRequestException('User is not a TEST_TECHNICIAN');
      }

      if (admin.testTechnicianType !== test.adminRole) {
        throw new BadRequestException(
          `Admin's testTechnicianType (${admin.testTechnicianType}) does not match test's adminRole (${test.adminRole})`,
        );
      }
    } else {
      // Auto-assign if admin not provided
      admin = await this.adminSelectionService.findAvailableAdmin(test.adminRole);
    }

    // Check if assignment already exists
    const existingAssignment = await this.assignmentsRepository.findOne({
      where: { patientId: dto.patientId, testId: dto.testId },
    });

    let assignment: Assignment;
    if (existingAssignment) {
      // Update existing assignment
      existingAssignment.adminId = admin?.id || null;
      existingAssignment.status = admin ? AssignmentStatus.ASSIGNED : AssignmentStatus.PENDING;
      existingAssignment.assignedAt = admin ? new Date() : null;
      existingAssignment.assignedBy = assignedByUserId;
      assignment = await this.assignmentsRepository.save(existingAssignment);
    } else {
      // Create new assignment
      assignment = this.assignmentsRepository.create({
        patientId: dto.patientId,
        testId: dto.testId,
        adminId: admin?.id || null,
        status: admin ? AssignmentStatus.ASSIGNED : AssignmentStatus.PENDING,
        assignedAt: admin ? new Date() : null,
        assignedBy: assignedByUserId,
      });
      assignment = await this.assignmentsRepository.save(assignment);
    }

    // Log audit
    await this.auditService.log(
      assignedByUserId,
      existingAssignment ? 'ASSIGNMENT_UPDATED' : 'ASSIGNMENT_CREATED',
      'Assignment',
      assignment.id,
      {
        patientId: dto.patientId,
        testId: dto.testId,
        adminId: admin?.id || null,
        status: assignment.status,
        manualAssigned: true,
      },
    );

    return this.mapToResponseDto(assignment);
  }

  async reassign(
    assignmentId: string,
    dto: ReassignAssignmentDto,
    assignedByUserId: string,
  ): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentsRepository.findOne({
      where: { id: assignmentId },
      relations: ['test'],
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    // Validate admin exists and has correct testTechnicianType
    const admin = await this.usersRepository.findOne({
      where: { id: dto.adminId, isActive: true },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${dto.adminId} not found or not active`);
    }

    if (admin.role !== UserRole.TEST_TECHNICIAN) {
      throw new BadRequestException('User is not a TEST_TECHNICIAN');
    }

    if (admin.testTechnicianType !== assignment.test.adminRole) {
      throw new BadRequestException(
        `Admin's testTechnicianType (${admin.testTechnicianType}) does not match test's adminRole (${assignment.test.adminRole})`,
      );
    }

    const oldAdminId = assignment.adminId;

    // Update assignment
    assignment.adminId = admin.id;
    assignment.status = AssignmentStatus.ASSIGNED;
    assignment.assignedAt = new Date();
    assignment.assignedBy = assignedByUserId;

    const updatedAssignment = await this.assignmentsRepository.save(assignment);

    // Log audit
    await this.auditService.log(
      assignedByUserId,
      'ASSIGNMENT_REASSIGNED',
      'Assignment',
      assignment.id,
      {
        oldAdminId,
        newAdminId: admin.id,
        patientId: assignment.patientId,
        testId: assignment.testId,
      },
    );

    return this.mapToResponseDto(updatedAssignment);
  }

  async updateStatus(
    assignmentId: string,
    dto: UpdateAssignmentStatusDto,
    userId: string,
  ): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentsRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    // Validate user owns assignment (for TEST_TECHNICIAN/LAB_TECHNICIAN)
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (
      (user?.role === UserRole.TEST_TECHNICIAN || user?.role === UserRole.LAB_TECHNICIAN) &&
      assignment.adminId !== userId
    ) {
      throw new ForbiddenException('You can only update your own assignments');
    }

    // Validate status transition
    this.validateStatusTransition(assignment.status, dto.status);

    // Update status and timestamps
    const oldStatus = assignment.status;
    assignment.status = dto.status;

    if (dto.status === AssignmentStatus.IN_PROGRESS && !assignment.startedAt) {
      assignment.startedAt = new Date();
    }

    if (dto.status === AssignmentStatus.COMPLETED && !assignment.completedAt) {
      assignment.completedAt = new Date();
    }

    const updatedAssignment = await this.assignmentsRepository.save(assignment);

    // Log audit
    await this.auditService.log(userId, 'ASSIGNMENT_STATUS_UPDATED', 'Assignment', assignment.id, {
      oldStatus,
      newStatus: dto.status,
      patientId: assignment.patientId,
      testId: assignment.testId,
    });

    return this.mapToResponseDto(updatedAssignment);
  }

  async findAll(queryDto: QueryAssignmentsDto): Promise<AssignmentResponseDto[]> {
    const where: any = {};

    if (queryDto.status) {
      where.status = queryDto.status;
    }

    if (queryDto.patientId) {
      where.patientId = queryDto.patientId;
    }

    if (queryDto.adminId) {
      where.adminId = queryDto.adminId;
    }

    if (queryDto.testId) {
      where.testId = queryDto.testId;
    }

    const assignments = await this.assignmentsRepository.find({
      where,
      relations: ['patient', 'test', 'admin', 'assignedByUser'],
      order: { createdAt: 'DESC' },
    });

    return this.mapToResponseDtos(assignments);
  }

  async findByPatient(patientId: string): Promise<AssignmentResponseDto[]> {
    const assignments = await this.assignmentsRepository.find({
      where: { patientId },
      relations: ['patient', 'test', 'admin', 'assignedByUser'],
      order: { createdAt: 'DESC' },
    });

    return this.mapToResponseDtos(assignments);
  }

  async findByAdmin(adminId: string, status?: AssignmentStatus): Promise<AssignmentResponseDto[]> {
    const where: any = { adminId };
    if (status) {
      where.status = status;
    }

    const assignments = await this.assignmentsRepository.find({
      where,
      relations: ['patient', 'test', 'admin', 'assignedByUser'],
      order: { createdAt: 'DESC' },
    });

    return this.mapToResponseDtos(assignments);
  }

  async findById(id: string): Promise<AssignmentResponseDto> {
    const assignment = await this.assignmentsRepository.findOne({
      where: { id },
      relations: ['patient', 'test', 'admin', 'assignedByUser'],
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${id} not found`);
    }

    return this.mapToResponseDto(assignment);
  }

  private validateStatusTransition(currentStatus: AssignmentStatus, newStatus: AssignmentStatus): void {
    const validTransitions: Record<AssignmentStatus, AssignmentStatus[]> = {
      [AssignmentStatus.PENDING]: [AssignmentStatus.ASSIGNED],
      [AssignmentStatus.ASSIGNED]: [AssignmentStatus.IN_PROGRESS],
      [AssignmentStatus.IN_PROGRESS]: [],
      [AssignmentStatus.COMPLETED]: [AssignmentStatus.SUBMITTED],
      [AssignmentStatus.SUBMITTED]: [], // No transitions from SUBMITTED
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}. Valid transitions: ${validTransitions[currentStatus]?.join(', ') || 'none'}`,
      );
    }
  }

  private mapToResponseDto(assignment: Assignment): AssignmentResponseDto {
    return {
      id: assignment.id,
      patientId: assignment.patientId,
      testId: assignment.testId,
      adminId: assignment.adminId,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      startedAt: assignment.startedAt,
      completedAt: assignment.completedAt,
      assignedBy: assignment.assignedBy,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      patient: assignment.patient
        ? {
            id: assignment.patient.id,
            patientId: assignment.patient.patientId,
            name: assignment.patient.name,
          }
        : undefined,
      test: assignment.test
        ? {
            id: assignment.test.id,
            name: assignment.test.name,
            category: assignment.test.category,
            adminRole: assignment.test.adminRole,
          }
        : undefined,
      admin: assignment.admin
        ? {
            id: assignment.admin.id,
            email: assignment.admin.email,
            fullName: assignment.admin.fullName,
            testTechnicianType: assignment.admin.testTechnicianType,
          }
        : null,
    };
  }

  private mapToResponseDtos(assignments: Assignment[]): AssignmentResponseDto[] {
    return assignments.map((assignment) => this.mapToResponseDto(assignment));
  }
}

