import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { PatientPackage } from './entities/patient-package.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaginatedPatientsResponseDto, PaginationMetaDto } from './dto/paginated-patients-response.dto';
import { PatientResponseDto } from './dto/patient-response.dto';
import { PatientProgressResponseDto } from './dto/patient-progress-response.dto';
import { PaginatedPatientProgressResponseDto } from './dto/patient-progress-response.dto';
import { TestProgressDto } from './dto/test-progress.dto';
import { PatientIdService } from './services/patient-id.service';
import { PriceCalculationService } from './services/price-calculation.service';
import { AuditService } from '../audit/audit.service';
import { PaymentStatus } from './constants/payment-status.enum';
import { Test } from '../tests/entities/test.entity';
import { Package } from '../packages/entities/package.entity';
import { PackageTest } from '../packages/entities/package-test.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { AssignmentStatus } from '../assignments/constants/assignment-status.enum';
import { TestResult } from '../results/entities/test-result.entity';
import { BloodSample } from '../blood-samples/entities/blood-sample.entity';
import { BloodSampleStatus } from '../blood-samples/constants/blood-sample-status.enum';
import { ProjectsService } from '../projects/projects.service';
import { ProjectStatus } from '../projects/constants/project-status.enum';
import { AssignmentsService } from '../assignments/assignments.service';
import { ProjectAccessService } from '../../common/services/project-access.service';
import { User, UserRole } from '../users/entities/user.entity';
import { Logger } from '@nestjs/common';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
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
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(TestResult)
    private testResultsRepository: Repository<TestResult>,
    @InjectRepository(BloodSample)
    private bloodSamplesRepository: Repository<BloodSample>,
    private patientIdService: PatientIdService,
    private priceCalculationService: PriceCalculationService,
    private auditService: AuditService,
    private projectsService: ProjectsService,
    private assignmentsService: AssignmentsService,
    private projectAccessService: ProjectAccessService,
  ) { }

  async register(createPatientDto: CreatePatientDto, registeredByUserId: string, userRole?: string): Promise<PatientResponseDto> {
    // Validate project if projectId is provided
    let project = null;
    if (createPatientDto.projectId) {
      if (userRole !== UserRole.SUPER_ADMIN && !(await this.projectAccessService.canAccessProject(registeredByUserId, createPatientDto.projectId, userRole))) {
        throw new ForbiddenException('You do not have access to this project');
      }

      try {
        project = await this.projectsService.findById(createPatientDto.projectId);

        // Receptionists can only use active projects
        if (userRole === 'RECEPTIONIST' && project.status !== ProjectStatus.ACTIVE) {
          throw new BadRequestException('Only active projects can be used for patient registration');
        }

        // Validate employee ID requirement if project settings require it
        if (project.campSettings?.requireEmployeeId && !createPatientDto.employeeId) {
          throw new BadRequestException('Employee ID is required for this project');
        }

        // Auto-populate company name from project if not provided
        if (!createPatientDto.companyName && project.companyName) {
          createPatientDto.companyName = project.companyName;
        }

        // Use default package from project if packageId is not provided
        if (!createPatientDto.packageId && project.campSettings?.defaultPackageId) {
          createPatientDto.packageId = project.campSettings.defaultPackageId;
        }
      } catch (error) {
        if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
        }
        throw new NotFoundException('Project not found');
      }
    }

    // Validate: Either packageId OR addonTestIds (with at least one test) must be provided
    const testIds = createPatientDto.addonTestIds || [];
    if (!createPatientDto.packageId && (!testIds || testIds.length === 0)) {
      throw new BadRequestException('Either a package must be selected or at least one test must be selected');
    }

    // Validate package exists and is active (only if packageId is provided)
    let pkg = null;
    if (createPatientDto.packageId) {
      pkg = await this.packagesRepository.findOne({
        where: { id: createPatientDto.packageId },
      });

      if (!pkg) {
        throw new NotFoundException('Package not found');
      }

      if (!pkg.isActive) {
        throw new BadRequestException('Package is not active');
      }
    }

    // Validate tests exist and are active
    if (testIds && testIds.length > 0) {
      const tests = await this.testsRepository.find({
        where: testIds.map((id) => ({ id, isActive: true })),
      });

      if (tests.length !== testIds.length) {
        throw new NotFoundException('One or more tests not found or not active');
      }
    }

    // Generate unique patient ID with project prefix if available
    let patientId: string;
    if (project?.campSettings?.autoGeneratePatientIds && project.campSettings.patientIdPrefix) {
      // Generate patient ID with project prefix
      patientId = await this.patientIdService.generatePatientId(project.campSettings.patientIdPrefix);
    } else {
      // Generate standard patient ID
      patientId = await this.patientIdService.generatePatientId();
    }

    // Calculate total price
    const totalPrice = await this.priceCalculationService.calculateTotalPrice(
      createPatientDto.packageId || null,
      testIds,
    );

    // Create patient
    const patient = this.patientsRepository.create({
      patientId,
      name: createPatientDto.name,
      age: createPatientDto.age,
      gender: createPatientDto.gender,
      contactNumber: createPatientDto.contactNumber,
      email: createPatientDto.email || null,
      employeeId: createPatientDto.employeeId || null,
      companyName: createPatientDto.companyName || null,
      address: createPatientDto.address || null,
      projectId: createPatientDto.projectId || null,
    });

    const savedPatient = await this.patientsRepository.save(patient);

    // Update project statistics if project exists
    if (project) {
      await this.projectsService.updateStatistics(project.id);
    }

    // Create patient package (packageId can be null if only tests are selected)
    const patientPackage = this.patientPackagesRepository.create({
      patientId: savedPatient.id,
      packageId: createPatientDto.packageId || null,
      addonTestIds: testIds,
      totalPrice,
      paymentStatus: PaymentStatus.PENDING,
      paymentAmount: 0,
      registeredBy: registeredByUserId,
    });

    await this.patientPackagesRepository.save(patientPackage);

    // Auto-assign tests to technicians
    try {
      await this.assignmentsService.autoAssign(savedPatient.id, registeredByUserId);
      this.logger.log(`Auto-assignment completed for patient ${savedPatient.patientId}`);
    } catch (error) {
      // Log error but don't fail patient registration
      this.logger.error(
        `Failed to auto-assign tests for patient ${savedPatient.patientId}: ${error.message}`,
        error.stack,
      );
      // Patient registration succeeds even if assignment fails
      // Assignments can be created manually later if needed
    }

    // Log audit
    await this.auditService.log(
      registeredByUserId,
      'PATIENT_REGISTERED',
      'Patient',
      savedPatient.id,
      {
        patientId: savedPatient.patientId,
        packageId: createPatientDto.packageId || null,
        testIds: testIds.length > 0 ? testIds : null,
        totalPrice,
      },
    );

    return this.mapToResponseDto(savedPatient);
  }

  async findAll(query: QueryPatientsDto, currentUser?: User): Promise<PaginatedPatientsResponseDto> {
    const { page = 1, limit = 10, search, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    let queryBuilder = this.patientsRepository.createQueryBuilder('patient');

    // Project filtering logic
    if (currentUser && currentUser.role !== UserRole.SUPER_ADMIN) {
      const allowedProjectIds = await this.projectAccessService.getUserProjectIds(currentUser.id, currentUser.role);

      if (allowedProjectIds.length === 0) {
        // If user has no projects, they see no patients (unless global role logic overrides, but "Project-Scoped" implies strict scope)
        // Return empty result immediately
        return {
          data: [],
          meta: { page, limit, total: 0, totalPages: 0 }
        };
      }

      if (query.projectId) {
        // If specific project requested, verify access
        if (!allowedProjectIds.includes(query.projectId)) {
          // Return empty or throw forbidden? Returning empty is safer for filters.
          // But if they asked for a specific project they can't access, maybe Forbidden is better?
          // Let's stick to filtering: if it's not in allowed, 0 results.
          queryBuilder.andWhere('1 = 0');
        } else {
          queryBuilder.andWhere('patient.projectId = :projectId', { projectId: query.projectId });
        }
      } else {
        // Show all patients from all allowed projects
        queryBuilder.andWhere('patient.projectId IN (:...projectIds)', { projectIds: allowedProjectIds });
      }
    } else if (query.projectId) {
      // SUPER_ADMIN filtering by specific project
      queryBuilder.andWhere('patient.projectId = :projectId', { projectId: query.projectId });
    }

    // Search filter
    if (search) {
      queryBuilder = queryBuilder.where(
        '(patient.name ILIKE :search OR patient.patientId ILIKE :search OR patient.contactNumber ILIKE :search OR patient.employeeId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Date filter
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Include entire end date

      if (search) {
        queryBuilder = queryBuilder.andWhere('patient.createdAt BETWEEN :dateFrom AND :dateTo', {
          dateFrom,
          dateTo,
        });
      } else {
        queryBuilder = queryBuilder.where('patient.createdAt BETWEEN :dateFrom AND :dateTo', {
          dateFrom,
          dateTo,
        });
      }
    } else if (dateFrom) {
      if (search) {
        queryBuilder = queryBuilder.andWhere('patient.createdAt >= :dateFrom', { dateFrom });
      } else {
        queryBuilder = queryBuilder.where('patient.createdAt >= :dateFrom', { dateFrom });
      }
    } else if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (search) {
        queryBuilder = queryBuilder.andWhere('patient.createdAt <= :dateTo', { dateTo });
      } else {
        queryBuilder = queryBuilder.where('patient.createdAt <= :dateTo', { dateTo });
      }
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .orderBy('patient.createdAt', 'DESC')
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    const meta: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages,
    };

    return {
      data: data.map((patient) => this.mapToResponseDto(patient)),
      meta,
    };
  }

  async getPatientProgress(query: QueryPatientsDto): Promise<PaginatedPatientProgressResponseDto> {
    const { page = 1, limit = 10, search, dateFrom, dateTo } = query;
    const skip = (page - 1) * limit;

    let queryBuilder = this.patientsRepository.createQueryBuilder('patient');

    // Search filter
    if (search) {
      queryBuilder = queryBuilder.where(
        '(patient.name ILIKE :search OR patient.patientId ILIKE :search OR patient.contactNumber ILIKE :search OR patient.employeeId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Date filter
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);

      if (search) {
        queryBuilder = queryBuilder.andWhere('patient.createdAt BETWEEN :dateFrom AND :dateTo', {
          dateFrom,
          dateTo,
        });
      } else {
        queryBuilder = queryBuilder.where('patient.createdAt BETWEEN :dateFrom AND :dateTo', {
          dateFrom,
          toDate,
        });
      }
    } else if (dateFrom) {
      if (search) {
        queryBuilder = queryBuilder.andWhere('patient.createdAt >= :dateFrom', { dateFrom });
      } else {
        queryBuilder = queryBuilder.where('patient.createdAt >= :dateFrom', { dateFrom });
      }
    } else if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (search) {
        queryBuilder = queryBuilder.andWhere('patient.createdAt <= :dateTo', { dateTo });
      } else {
        queryBuilder = queryBuilder.where('patient.createdAt <= :dateTo', { dateTo });
      }
    }

    const [patients, total] = await queryBuilder
      .leftJoinAndSelect('patient.patientPackages', 'patientPackages')
      .leftJoinAndSelect('patientPackages.package', 'package')
      .skip(skip)
      .take(limit)
      .orderBy('patient.createdAt', 'DESC')
      .getManyAndCount();

    // Get progress for each patient
    const patientProgressPromises = patients.map((patient) => this.calculatePatientProgress(patient));
    const patientProgressData = await Promise.all(patientProgressPromises);

    const totalPages = Math.ceil(total / limit);

    const meta: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages,
    };

    return {
      data: patientProgressData,
      meta,
    };
  }

  private async calculatePatientProgress(patient: Patient): Promise<PatientProgressResponseDto> {
    const patientPackage = patient.patientPackages?.[0];
    if (!patientPackage) {
      // No package - return empty progress
      const baseDto = this.mapToResponseDto(patient);
      return {
        ...baseDto,
        testProgress: [],
        totalTestsExpected: 0,
        testsAssigned: 0,
        testsCompleted: 0,
        missingTests: 0,
        overallProgress: 0,
        hasMissingItems: false,
        bloodSampleStatus: null,
        bloodSampleMissing: true,
      };
    }

    // Get all tests from package (if package exists) and addon tests
    const packageTestIds: string[] = [];
    if (patientPackage.packageId) {
      const packageTests = await this.packageTestsRepository.find({
        where: { packageId: patientPackage.packageId },
        relations: ['test'],
      });
      packageTestIds.push(...packageTests.map((pt) => pt.testId));
    }

    const addonTestIds = patientPackage.addonTestIds || [];
    const allTestIds = [...packageTestIds, ...addonTestIds];

    // Get all tests
    const tests = allTestIds.length > 0
      ? await this.testsRepository.find({
        where: { id: In(allTestIds), isActive: true },
      })
      : [];

    // Get all assignments for patient
    const assignments = await this.assignmentsRepository.find({
      where: { patientId: patient.id },
      relations: ['test'],
    });

    const assignmentMap = new Map<string, Assignment>();
    assignments.forEach((assignment) => {
      assignmentMap.set(assignment.testId, assignment);
    });

    // Get all results for assignments
    const assignmentIds = assignments.map((a) => a.id);
    const results = assignmentIds.length > 0
      ? await this.testResultsRepository.find({
        where: assignmentIds.map((id) => ({ assignmentId: id })),
      })
      : [];

    const resultMap = new Map<string, TestResult>();
    results.forEach((result) => {
      const assignment = assignments.find((a) => a.id === result.assignmentId);
      if (assignment) {
        resultMap.set(assignment.testId, result);
      }
    });

    // Get blood sample
    const bloodSample = await this.bloodSamplesRepository.findOne({
      where: { patientId: patient.id },
      order: { createdAt: 'DESC' },
    });

    // Calculate progress for each test
    const testProgress: TestProgressDto[] = tests.map((test) => {
      const assignment = assignmentMap.get(test.id);
      const hasResult = resultMap.has(test.id);
      const isMissing = !assignment || assignment.status !== AssignmentStatus.SUBMITTED || !hasResult;

      return {
        testId: test.id,
        testName: test.name,
        assignmentId: assignment?.id || null,
        assignmentStatus: assignment?.status || null,
        hasResult,
        isMissing,
      };
    });

    // Count statistics
    const totalTestsExpected = tests.length;
    const testsAssigned = assignments.length;
    const testsCompleted = testProgress.filter((tp) => tp.assignmentStatus === AssignmentStatus.SUBMITTED && tp.hasResult).length;
    const missingTests = testProgress.filter((tp) => tp.isMissing).length;

    // Calculate overall progress (tests completed / tests expected)
    const overallProgress = totalTestsExpected > 0 ? Math.round((testsCompleted / totalTestsExpected) * 100) : 0;

    // Check for missing items
    const bloodSampleMissing = !bloodSample || bloodSample.status !== BloodSampleStatus.COMPLETED;
    const hasMissingItems = missingTests > 0 || bloodSampleMissing;

    const baseDto = this.mapToResponseDto(patient);

    return {
      ...baseDto,
      testProgress,
      totalTestsExpected,
      testsAssigned,
      testsCompleted,
      missingTests,
      overallProgress,
      hasMissingItems,
      bloodSampleStatus: bloodSample?.status || null,
      bloodSampleMissing,
    };
  }

  async getPatientsByProject(projectId: string, query: QueryPatientsDto, currentUser: User): Promise<PaginatedPatientsResponseDto> {
    if (!await this.projectAccessService.canAccessProject(currentUser.id, projectId, currentUser.role)) {
      throw new ForbiddenException('You do not have access to this project');
    }
    // Force projectId filter
    return this.findAll({ ...query, projectId }, currentUser);
  }

  async findById(id: string, currentUser?: User): Promise<PatientResponseDto> {
    const patient = await this.patientsRepository.findOne({
      where: { id },
      relations: ['patientPackages', 'patientPackages.package', 'patientPackages.registeredByUser'],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (currentUser && currentUser.role !== UserRole.SUPER_ADMIN) {
      if (!patient.projectId) {
        // Logic decision: Can users see patients without projects?
        // Assuming no, unless logic dictates otherwise.
        // For now, let's allow seeing non-project patients OR restrict.
        // "Project-Scoped Access Control" implies strictness.
        // If patient has no project, maybe they are global?
        // Let's assume strict: if patient.projectId is null, only SUPER_ADMIN sees?
        // Or maybe default project?
        // Safer: if patient.projectId exists, check access.
      }

      if (patient.projectId && !(await this.projectAccessService.canAccessProject(currentUser.id, patient.projectId, currentUser.role))) {
        throw new ForbiddenException('You do not have access to this patient');
      }
    }

    return this.mapToResponseDto(patient, true);
  }

  async findByPatientId(patientId: string, currentUser?: User): Promise<PatientResponseDto> {
    const patient = await this.patientsRepository.findOne({
      where: { patientId },
      relations: ['patientPackages', 'patientPackages.package', 'patientPackages.registeredByUser'],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (currentUser && currentUser.role !== UserRole.SUPER_ADMIN) {
      if (patient.projectId && !(await this.projectAccessService.canAccessProject(currentUser.id, patient.projectId, currentUser.role))) {
        throw new ForbiddenException('You do not have access to this patient');
      }
    }

    return this.mapToResponseDto(patient, true);
  }

  async update(id: string, updatePatientDto: UpdatePatientDto, userId: string): Promise<PatientResponseDto> {
    const patient = await this.patientsRepository.findOne({ where: { id } });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Track changes for audit
    const changes: Record<string, any> = {};
    Object.keys(updatePatientDto).forEach((key) => {
      if (updatePatientDto[key as keyof UpdatePatientDto] !== undefined) {
        changes[key] = {
          old: patient[key as keyof Patient],
          new: updatePatientDto[key as keyof UpdatePatientDto],
        };
      }
    });

    await this.patientsRepository.update(id, updatePatientDto);

    // Log audit
    await this.auditService.log(userId, 'PATIENT_UPDATED', 'Patient', id, changes);

    const updatedPatient = await this.patientsRepository.findOne({
      where: { id },
      relations: ['patientPackages', 'patientPackages.package', 'patientPackages.registeredByUser'],
    });

    return this.mapToResponseDto(updatedPatient!, true);
  }

  async updatePayment(id: string, updatePaymentDto: UpdatePaymentDto, userId: string): Promise<PatientResponseDto> {
    const patient = await this.patientsRepository.findOne({
      where: { id },
      relations: ['patientPackages'],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const patientPackage = patient.patientPackages?.[0];
    if (!patientPackage) {
      throw new NotFoundException('Patient package not found');
    }

    // Parse total price to number (TypeORM returns decimal as string)
    const totalPrice = Number(patientPackage.totalPrice);

    // Validate payment amount
    if (updatePaymentDto.paymentAmount > totalPrice) {
      throw new BadRequestException('Payment amount cannot exceed total price');
    }

    // Validate payment status logic
    if (updatePaymentDto.paymentStatus === PaymentStatus.PAID && updatePaymentDto.paymentAmount !== totalPrice) {
      throw new BadRequestException('Payment amount must equal total price for PAID status');
    }

    if (updatePaymentDto.paymentStatus === PaymentStatus.PARTIAL && updatePaymentDto.paymentAmount >= totalPrice) {
      throw new BadRequestException('Payment amount must be less than total price for PARTIAL status');
    }

    if (updatePaymentDto.paymentStatus === PaymentStatus.PENDING && updatePaymentDto.paymentAmount !== 0) {
      throw new BadRequestException('Payment amount must be 0 for PENDING status');
    }

    const oldPaymentStatus = patientPackage.paymentStatus;
    const oldPaymentAmount = patientPackage.paymentAmount;

    await this.patientPackagesRepository.update(patientPackage.id, {
      paymentStatus: updatePaymentDto.paymentStatus,
      paymentAmount: updatePaymentDto.paymentAmount,
    });

    // Log audit
    await this.auditService.log(userId, 'PAYMENT_UPDATED', 'PatientPackage', patientPackage.id, {
      patientId: patient.id,
      oldPaymentStatus,
      newPaymentStatus: updatePaymentDto.paymentStatus,
      oldPaymentAmount,
      newPaymentAmount: updatePaymentDto.paymentAmount,
    });

    const updatedPatient = await this.patientsRepository.findOne({
      where: { id },
      relations: ['patientPackages', 'patientPackages.package', 'patientPackages.registeredByUser'],
    });

    return this.mapToResponseDto(updatedPatient!, true);
  }

  private mapToResponseDto(patient: Patient, includePackages = false): PatientResponseDto {
    const dto: PatientResponseDto = {
      id: patient.id,
      patientId: patient.patientId,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      contactNumber: patient.contactNumber,
      email: patient.email,
      employeeId: patient.employeeId,
      companyName: patient.companyName,
      address: patient.address,
      projectId: patient.projectId,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };

    if (includePackages && patient.patientPackages) {
      dto.patientPackages = patient.patientPackages.map((pp) => ({
        id: pp.id,
        packageId: pp.packageId,
        packageName: pp.package?.name || null,
        addonTestIds: pp.addonTestIds,
        totalPrice: parseFloat(pp.totalPrice.toString()),
        paymentStatus: pp.paymentStatus,
        paymentAmount: parseFloat(pp.paymentAmount.toString()),
        registeredBy: pp.registeredBy,
        createdAt: pp.createdAt,
        updatedAt: pp.updatedAt,
      }));
    }

    return dto;
  }
}

