import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BloodSample } from './entities/blood-sample.entity';
import { BloodSampleAccess } from './entities/blood-sample-access.entity';
import { BloodSampleStatus } from './constants/blood-sample-status.enum';
import { Patient } from '../patients/entities/patient.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { AssignmentStatus } from '../assignments/constants/assignment-status.enum';
import { Test } from '../tests/entities/test.entity';
import { TestCategory } from '../tests/constants/test-category';
import { TestResult } from '../results/entities/test-result.entity';
import { RegisterBloodSampleDto } from './dto/register-blood-sample.dto';
import { AccessBloodSampleDto } from './dto/access-blood-sample.dto';
import { UpdateBloodSampleStatusDto } from './dto/update-blood-sample-status.dto';
import { SubmitBloodTestResultDto } from './dto/submit-blood-test-result.dto';
import { BloodSampleResponseDto, RegisterBloodSampleResponseDto } from './dto/blood-sample-response.dto';
import { SampleIdService } from './services/sample-id.service';
import { PasscodeService } from './services/passcode.service';
import { ResultValidationService } from '../results/services/result-validation.service';
import { AuditService } from '../audit/audit.service';
import { ProjectAccessService } from '../../common/services/project-access.service';

@Injectable()
export class BloodSamplesService {
  constructor(
    @InjectRepository(BloodSample)
    private bloodSamplesRepository: Repository<BloodSample>,
    @InjectRepository(BloodSampleAccess)
    private bloodSampleAccessRepository: Repository<BloodSampleAccess>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(Test)
    private testsRepository: Repository<Test>,
    @InjectRepository(TestResult)
    private testResultsRepository: Repository<TestResult>,
    private sampleIdService: SampleIdService,
    private passcodeService: PasscodeService,
    private resultValidationService: ResultValidationService,
    private auditService: AuditService,
    private projectAccessService: ProjectAccessService,
  ) { }

  async registerBloodSample(
    dto: RegisterBloodSampleDto,
    collectedByUserId: string,
    userRole: UserRole,
  ): Promise<RegisterBloodSampleResponseDto> {
    // Validate patient exists
    const patient = await this.patientsRepository.findOne({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${dto.patientId} not found`);
    }

    if (patient.projectId && !(await this.projectAccessService.canAccessProject(collectedByUserId, patient.projectId, userRole))) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Generate sample ID
    const sampleId = await this.sampleIdService.generateSampleId();

    // Generate and hash passcode
    const plainPasscode = this.passcodeService.generatePasscode();
    const passcodeHash = await this.passcodeService.hashPasscode(plainPasscode);

    // Find blood test (look for a test with category 'lab')
    // In a real scenario, you might want to search by a specific test name or adminRole
    const bloodTest = await this.testsRepository
      .createQueryBuilder('test')
      .where('test.category = :category', { category: TestCategory.LAB })
      .andWhere('test.isActive = :isActive', { isActive: true })
      .getOne();

    if (!bloodTest) {
      throw new NotFoundException('Blood test not found. Please create a blood test first.');
    }

    // Create blood sample
    const bloodSample = this.bloodSamplesRepository.create({
      patientId: dto.patientId,
      sampleId,
      passcodeHash,
      collectedAt: new Date(),
      collectedBy: collectedByUserId,
      status: BloodSampleStatus.COLLECTED,
      testedAt: null,
      testedBy: null,
      assignmentId: null,
    });

    const savedSample = await this.bloodSamplesRepository.save(bloodSample);

    // Create assignment for blood test
    const assignment = this.assignmentsRepository.create({
      patientId: dto.patientId,
      testId: bloodTest.id,
      adminId: null, // Will be assigned when lab tech accesses with passcode
      status: AssignmentStatus.PENDING,
      assignedAt: null,
      assignedBy: collectedByUserId,
    });

    const savedAssignment = await this.assignmentsRepository.save(assignment);

    // Link assignment to sample
    savedSample.assignmentId = savedAssignment.id;
    await this.bloodSamplesRepository.save(savedSample);

    // Log action
    await this.auditService.log(
      collectedByUserId,
      'BLOOD_SAMPLE_REGISTERED',
      'BloodSample',
      savedSample.id,
      {
        patientId: dto.patientId,
        sampleId,
        assignmentId: savedAssignment.id,
      },
    );

    return {
      id: savedSample.id,
      sampleId,
      passcode: plainPasscode, // Return plain passcode only once
      patientId: dto.patientId,
      collectedAt: savedSample.collectedAt,
    };
  }

  async accessBloodSample(
    dto: AccessBloodSampleDto,
    accessedByUserId: string,
    userRole: UserRole, // Added role
  ): Promise<BloodSampleResponseDto> {
    // Find sample by sampleId
    const sample = await this.bloodSamplesRepository.findOne({
      where: { sampleId: dto.sampleId },
      relations: ['patient', 'collectedByUser', 'testedByUser'],
    });

    if (!sample) {
      throw new NotFoundException(`Blood sample with ID ${dto.sampleId} not found`);
    }

    if (sample.patient?.projectId && !(await this.projectAccessService.canAccessProject(accessedByUserId, sample.patient.projectId, userRole))) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Verify passcode
    const isPasscodeValid = await this.passcodeService.comparePasscode(
      dto.passcode,
      sample.passcodeHash,
    );

    if (!isPasscodeValid) {
      throw new ForbiddenException('Invalid passcode');
    }

    // Validate status
    if (
      sample.status !== BloodSampleStatus.COLLECTED &&
      sample.status !== BloodSampleStatus.IN_LAB
    ) {
      throw new BadRequestException(
        `Cannot access sample with status ${sample.status}. Sample must be COLLECTED or IN_LAB.`,
      );
    }

    // Update status to IN_LAB if it's COLLECTED
    if (sample.status === BloodSampleStatus.COLLECTED) {
      sample.status = BloodSampleStatus.IN_LAB;
      await this.bloodSamplesRepository.save(sample);
    }

    // Get current user
    const currentUser = await this.usersRepository.findOne({
      where: { id: accessedByUserId },
    });

    if (!currentUser || currentUser.role !== UserRole.LAB_TECHNICIAN) {
      throw new ForbiddenException('Only lab technicians can access blood samples');
    }

    // Assign assignment to current user if not assigned
    if (sample.assignmentId) {
      const assignment = await this.assignmentsRepository.findOne({
        where: { id: sample.assignmentId },
      });

      if (assignment && !assignment.adminId) {
        assignment.adminId = accessedByUserId;
        assignment.status = AssignmentStatus.ASSIGNED;
        assignment.assignedAt = new Date();
        await this.assignmentsRepository.save(assignment);
      }
    }

    // Log access
    const accessLog = this.bloodSampleAccessRepository.create({
      sampleId: sample.id,
      accessedBy: accessedByUserId,
      accessedAt: new Date(),
    });
    await this.bloodSampleAccessRepository.save(accessLog);

    // Log audit
    await this.auditService.log(
      accessedByUserId,
      'BLOOD_SAMPLE_ACCESSED',
      'BloodSample',
      sample.id,
      {
        sampleId: dto.sampleId,
        patientId: sample.patientId,
      },
    );

    return this.mapToResponseDto(sample);
  }

  async updateStatus(
    id: string,
    dto: UpdateBloodSampleStatusDto,
    userId: string,
    userRole: UserRole,
  ): Promise<BloodSampleResponseDto> {
    const sample = await this.bloodSamplesRepository.findOne({
      where: { id },
      relations: ['patient', 'collectedByUser', 'testedByUser'],
    });

    if (!sample) {
      throw new NotFoundException(`Blood sample with ID ${id} not found`);
    }

    // Validate status transition
    const validTransitions: Record<BloodSampleStatus, BloodSampleStatus[]> = {
      [BloodSampleStatus.COLLECTED]: [BloodSampleStatus.IN_LAB],
      [BloodSampleStatus.IN_LAB]: [BloodSampleStatus.TESTED, BloodSampleStatus.COLLECTED],
      [BloodSampleStatus.TESTED]: [BloodSampleStatus.COMPLETED],
      [BloodSampleStatus.COMPLETED]: [],
    };

    const allowedStatuses = validTransitions[sample.status];
    if (!allowedStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${sample.status} to ${dto.status}. Valid transitions: ${allowedStatuses.join(', ')}`,
      );
    }

    const oldStatus = sample.status;
    sample.status = dto.status;

    // Update testedAt and testedBy if status is TESTED
    if (dto.status === BloodSampleStatus.TESTED && !sample.testedAt) {
      sample.testedAt = new Date();
      sample.testedBy = userId;
    }

    const updatedSample = await this.bloodSamplesRepository.save(sample);

    // Log audit
    await this.auditService.log(userId, 'BLOOD_SAMPLE_STATUS_UPDATED', 'BloodSample', id, {
      oldStatus,
      newStatus: dto.status,
    });

    return this.mapToResponseDto(updatedSample);
  }

  async findById(id: string, userId: string): Promise<BloodSampleResponseDto> {
    const userRole = (await this.usersRepository.findOne({ where: { id: userId } }))?.role;
    if (!userRole) throw new ForbiddenException('User not found');

    const sample = await this.bloodSamplesRepository.findOne({
      where: { id },
      relations: ['patient', 'collectedByUser', 'testedByUser'],
    });

    if (!sample) {
      throw new NotFoundException(`Blood sample with ID ${id} not found`);
    }

    // Check access: SUPER_ADMIN or user who accessed it with passcode
    const currentUser = await this.usersRepository.findOne({ where: { id: userId } });
    if (currentUser?.role !== UserRole.SUPER_ADMIN) {
      // Check if user has accessed this sample
      const accessLog = await this.bloodSampleAccessRepository.findOne({
        where: { sampleId: id, accessedBy: userId },
      });

      if (!accessLog) {
        throw new ForbiddenException('You do not have access to this blood sample');
      }
    }

    return this.mapToResponseDto(sample);
  }

  async findAll(status?: BloodSampleStatus): Promise<BloodSampleResponseDto[]> {
    const queryBuilder = this.bloodSamplesRepository
      .createQueryBuilder('sample')
      .leftJoinAndSelect('sample.patient', 'patient')
      .leftJoinAndSelect('sample.collectedByUser', 'collectedByUser')
      .leftJoinAndSelect('sample.testedByUser', 'testedByUser')
      .orderBy('sample.createdAt', 'DESC');

    if (status) {
      queryBuilder.where('sample.status = :status', { status });
    }

    const samples = await queryBuilder.getMany();
    return samples.map((sample) => this.mapToResponseDto(sample));
  }

  async findMySamples(userId: string, status?: BloodSampleStatus): Promise<BloodSampleResponseDto[]> {
    // Get all samples accessed by this user
    const accessLogs = await this.bloodSampleAccessRepository.find({
      where: { accessedBy: userId },
      relations: ['sample', 'sample.patient', 'sample.collectedByUser', 'sample.testedByUser'],
      order: { accessedAt: 'DESC' },
    });

    let samples = accessLogs.map((log) => log.sample);

    // Filter by status if provided
    if (status) {
      samples = samples.filter((s) => s.status === status);
    }

    return samples.map((sample) => this.mapToResponseDto(sample));
  }

  async submitBloodTestResult(
    id: string,
    dto: SubmitBloodTestResultDto,
    userId: string,
    userRole: UserRole, // Added role
  ): Promise<any> {
    const sample = await this.bloodSamplesRepository.findOne({
      where: { id },
      relations: ['assignment', 'assignment.test', 'patient'],
    });

    if (!sample) {
      throw new NotFoundException(`Blood sample with ID ${id} not found`);
    }

    // Validate sample status
    if (sample.status !== BloodSampleStatus.IN_LAB && sample.status !== BloodSampleStatus.TESTED) {
      throw new BadRequestException(
        `Cannot submit results for sample with status ${sample.status}. Sample must be IN_LAB or TESTED.`,
      );
    }

    // Check if user has accessed this sample
    const accessLog = await this.bloodSampleAccessRepository.findOne({
      where: { sampleId: id, accessedBy: userId },
    });

    if (!accessLog) {
      throw new ForbiddenException('You must access the sample with passcode before submitting results');
    }

    if (!sample.assignmentId) {
      throw new BadRequestException('Sample does not have an associated assignment');
    }

    const assignment = await this.assignmentsRepository.findOne({
      where: { id: sample.assignmentId },
      relations: ['test'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found for this sample');
    }

    // Validate assignment belongs to current user
    if (assignment.adminId !== userId) {
      throw new ForbiddenException('You can only submit results for your own assignments');
    }

    // Validate assignment status
    if (
      assignment.status !== AssignmentStatus.IN_PROGRESS &&
      assignment.status !== AssignmentStatus.ASSIGNED
    ) {
      throw new BadRequestException(
        `Cannot submit results. Assignment must be IN_PROGRESS or ASSIGNED. Current status: ${assignment.status}`,
      );
    }

    // Check if result already exists
    const existingResult = await this.testResultsRepository.findOne({
      where: { assignmentId: sample.assignmentId },
    });

    if (existingResult) {
      throw new BadRequestException('Result already exists for this assignment');
    }

    // Validate result values
    const validation = this.resultValidationService.validateResultValues(
      assignment.test.testFields,
      dto.resultValues,
      null,
      null,
    );

    if (!validation.isValid) {
      throw new BadRequestException(`Validation failed: ${validation.errors.join('; ')}`);
    }

    // Create test result
    const testResult = this.testResultsRepository.create({
      assignmentId: sample.assignmentId,
      resultValues: dto.resultValues,
      notes: dto.notes || null,
      enteredBy: userId,
      enteredAt: new Date(),
      isVerified: false,
      verifiedBy: null,
      verifiedAt: null,
    });

    const savedResult = await this.testResultsRepository.save(testResult);

    // Update sample status to TESTED
    sample.status = BloodSampleStatus.TESTED;
    sample.testedAt = new Date();
    sample.testedBy = userId;
    await this.bloodSamplesRepository.save(sample);

    // Update assignment status to SUBMITTED
    assignment.status = AssignmentStatus.SUBMITTED;
    await this.assignmentsRepository.save(assignment);

    // Log audit
    await this.auditService.log(userId, 'BLOOD_TEST_RESULT_SUBMITTED', 'BloodSample', id, {
      sampleId: sample.sampleId,
      assignmentId: sample.assignmentId,
      resultId: savedResult.id,
      warnings: validation.warnings,
    });

    return {
      id: savedResult.id,
      assignmentId: savedResult.assignmentId,
      resultValues: savedResult.resultValues,
      notes: savedResult.notes,
      warnings: validation.warnings,
    };
  }

  private mapToResponseDto(sample: BloodSample): BloodSampleResponseDto {
    return {
      id: sample.id,
      patientId: sample.patientId,
      sampleId: sample.sampleId,
      collectedAt: sample.collectedAt,
      collectedBy: sample.collectedBy,
      status: sample.status,
      testedAt: sample.testedAt,
      testedBy: sample.testedBy,
      assignmentId: sample.assignmentId,
      createdAt: sample.createdAt,
      updatedAt: sample.updatedAt,
      patient: {
        id: sample.patient.id,
        patientId: sample.patient.patientId,
        name: sample.patient.name,
        age: sample.patient.age,
        gender: sample.patient.gender,
        contactNumber: sample.patient.contactNumber,
      },
      collectedByUser: {
        id: sample.collectedByUser.id,
        email: sample.collectedByUser.email,
        fullName: sample.collectedByUser.fullName,
      },
      testedByUser: sample.testedByUser
        ? {
          id: sample.testedByUser.id,
          email: sample.testedByUser.email,
          fullName: sample.testedByUser.fullName,
        }
        : null,
    };
  }
}

