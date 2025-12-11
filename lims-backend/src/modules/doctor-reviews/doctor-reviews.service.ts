import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { DoctorReview } from './entities/doctor-review.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { AssignmentStatus } from '../assignments/constants/assignment-status.enum';
import { TestResult } from '../results/entities/test-result.entity';
import { BloodSample } from '../blood-samples/entities/blood-sample.entity';
import { BloodSampleStatus } from '../blood-samples/constants/blood-sample-status.enum';
import { CreateReviewDto } from './dto/create-review.dto';
import { SignReportDto } from './dto/sign-report.dto';
import { QueryPatientsDto, ReviewStatus } from './dto/query-patients.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { PatientReviewResponseDto, PaginatedPatientsResponseDto } from './dto/patient-review-response.dto';
import { PatientResultsResponseDto } from './dto/review-response.dto';
import { PasskeyService } from '../auth/services/passkey.service';
// Removed duplicate PasskeyService import
import { AuditService } from '../audit/audit.service';
import { ProjectAccessService } from '../../common/services/project-access.service';
import { UserRole } from '../users/entities/user.entity';
import { PatientResponseDto } from '../patients/dto/patient-response.dto';
import { ResultResponseDto } from '../results/dto/result-response.dto';
import { AssignmentResponseDto } from '../assignments/dto/assignment-response.dto';
import { BloodSampleResponseDto } from '../blood-samples/dto/blood-sample-response.dto';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class DoctorReviewsService {
  private readonly logger = new Logger(DoctorReviewsService.name);

  constructor(
    @InjectRepository(DoctorReview)
    private doctorReviewsRepository: Repository<DoctorReview>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(TestResult)
    private testResultsRepository: Repository<TestResult>,
    @InjectRepository(BloodSample)
    private bloodSamplesRepository: Repository<BloodSample>,
    private passkeyService: PasskeyService,
    private auditService: AuditService,
    private projectAccessService: ProjectAccessService,
    @Inject(forwardRef(() => ReportsService))
    private reportsService: ReportsService,
  ) { }

  async findPatientsForReview(
    doctorId: string,
    queryDto: QueryPatientsDto,
    userRole: UserRole, // Added userRole
  ): Promise<PaginatedPatientsResponseDto> {
    const { status, search, page = 1, limit = 10 } = queryDto;
    const skip = (page - 1) * limit;

    // Get all patients with assignments
    let query = this.patientsRepository
      .createQueryBuilder('patient')
      .leftJoinAndSelect('patient.patientPackages', 'patientPackage')
      .leftJoin('patientPackage.package', 'package');

    // Apply search filter
    if (search) {
      query = query.where(
        '(patient.name ILIKE :search OR patient.patientId ILIKE :search OR patient.contactNumber ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (userRole !== UserRole.SUPER_ADMIN) {
      const allowedProjectIds = await this.projectAccessService.getUserProjectIds(doctorId, userRole);
      if (allowedProjectIds.length > 0) {
        query.andWhere('patient.projectId IN (:...allowedProjectIds)', { allowedProjectIds });
      } else {
        // User has no projects, return empty result
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        };
      }
    }

    const [patients, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Filter patients based on review status
    const filteredPatients: PatientReviewResponseDto[] = [];

    for (const patient of patients) {
      // Get all assignments for patient
      const assignments = await this.assignmentsRepository.find({
        where: { patientId: patient.id },
      });

      if (assignments.length === 0) {
        continue; // Skip patients with no assignments
      }

      // Check if all assignments are SUBMITTED
      const allSubmitted = assignments.every(
        (a) => a.status === AssignmentStatus.SUBMITTED,
      );

      if (!allSubmitted) {
        continue; // Skip patients with incomplete tests
      }

      // Get review if exists
      const review = await this.doctorReviewsRepository.findOne({
        where: { patientId: patient.id, doctorId },
      });

      // Determine review status
      let reviewStatus: 'PENDING' | 'REVIEWED' | 'SIGNED';
      if (review?.isSigned) {
        reviewStatus = 'SIGNED';
      } else if (review?.reviewedAt) {
        reviewStatus = 'REVIEWED';
      } else {
        reviewStatus = 'PENDING';
      }

      // Apply status filter
      if (status) {
        if (status === ReviewStatus.PENDING && reviewStatus !== 'PENDING') {
          continue;
        }
        if (status === ReviewStatus.REVIEWED && reviewStatus !== 'REVIEWED') {
          continue;
        }
        if (status === ReviewStatus.SIGNED && reviewStatus !== 'SIGNED') {
          continue;
        }
      }

      // Count submitted tests
      const submittedTests = assignments.filter(
        (a) => a.status === AssignmentStatus.SUBMITTED,
      ).length;

      filteredPatients.push({
        patient: this.mapPatientToDto(patient),
        status: reviewStatus,
        reviewId: review?.id,
        reviewedAt: review?.reviewedAt || undefined,
        signedAt: review?.signedAt || undefined,
        totalTests: assignments.length,
        submittedTests,
      });
    }

    const totalPages = Math.ceil(filteredPatients.length / limit);

    return {
      data: filteredPatients,
      total: filteredPatients.length,
      page,
      limit,
      totalPages,
    };
  }

  async getPatientResults(
    patientId: string,
    doctorId: string,
    userRole: UserRole,
  ): Promise<PatientResultsResponseDto> {
    // Get patient
    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      relations: ['patientPackages', 'patientPackages.package'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    if (patient.projectId && !(await this.projectAccessService.canAccessProject(doctorId, patient.projectId, userRole))) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Get all assignments for patient
    const assignments = await this.assignmentsRepository.find({
      where: { patientId },
      relations: ['test', 'admin', 'patient', 'assignedByUser'],
      order: { createdAt: 'ASC' },
    });

    // Get all test results for these assignments
    const assignmentIds = assignments.map((a) => a.id);
    const results = assignmentIds.length > 0
      ? await this.testResultsRepository.find({
        where: assignmentIds.map((id) => ({ assignmentId: id })),
        relations: ['assignment', 'assignment.test', 'assignment.patient', 'enteredByUser', 'verifiedByUser'],
        order: { enteredAt: 'DESC' },
      })
      : [];

    // Get blood sample if exists
    const bloodSample = await this.bloodSamplesRepository.findOne({
      where: { patientId },
      relations: ['patient', 'collectedByUser', 'testedByUser'],
      order: { createdAt: 'DESC' },
    });

    // Get review if exists
    const review = await this.doctorReviewsRepository.findOne({
      where: { patientId, doctorId },
    });

    return {
      patient: this.mapPatientToDto(patient),
      results: results.map((r) => this.mapResultToDto(r)),
      assignments: assignments.map((a) => this.mapAssignmentToDto(a)),
      bloodSample: bloodSample ? this.mapBloodSampleToDto(bloodSample) : undefined,
      review: review
        ? {
          id: review.id,
          remarks: review.remarks,
          reviewedAt: review.reviewedAt,
          signedAt: review.signedAt,
          isSigned: review.isSigned,
        }
        : undefined,
    };
  }

  async createOrUpdateReview(
    dto: CreateReviewDto,
    doctorId: string,
    userRole: UserRole,
  ): Promise<ReviewResponseDto> {
    // Validate all assignments are SUBMITTED
    const assignments = await this.assignmentsRepository.find({
      where: { patientId: dto.patientId },
      relations: ['patient'],
    });

    if (assignments.length > 0) {
      const patient = assignments[0].patient;
      if (patient?.projectId && !(await this.projectAccessService.canAccessProject(doctorId, patient.projectId, userRole))) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    if (assignments.length === 0) {
      throw new BadRequestException('Patient has no assignments');
    }

    const allSubmitted = assignments.every(
      (a) => a.status === AssignmentStatus.SUBMITTED,
    );

    if (!allSubmitted) {
      throw new BadRequestException(
        'All tests must be SUBMITTED before creating a review',
      );
    }

    // Check if review exists
    let review = await this.doctorReviewsRepository.findOne({
      where: { patientId: dto.patientId, doctorId },
    });

    const isUpdate = !!review;

    if (review) {
      // Update existing review
      review.remarks = dto.remarks || review.remarks;
      review.reviewedAt = new Date();
    } else {
      // Create new review
      review = this.doctorReviewsRepository.create({
        patientId: dto.patientId,
        doctorId,
        remarks: dto.remarks || null,
        reviewedAt: new Date(),
        signedAt: null,
        passkeyVerified: false,
        isSigned: false,
      });
    }

    const savedReview = await this.doctorReviewsRepository.save(review);

    // Log audit
    await this.auditService.log(
      doctorId,
      isUpdate ? 'DOCTOR_REVIEW_UPDATED' : 'DOCTOR_REVIEW_CREATED',
      'DoctorReview',
      savedReview.id,
      {
        patientId: dto.patientId,
        remarks: dto.remarks,
      },
    );

    return this.mapReviewToDto(savedReview);
  }

  async signReport(
    dto: SignReportDto,
    doctorId: string,
    userRole: UserRole,
  ): Promise<ReviewResponseDto> {
    // Validate all assignments are SUBMITTED
    const assignments = await this.assignmentsRepository.find({
      where: { patientId: dto.patientId },
      relations: ['patient'],
    });

    if (assignments.length > 0) {
      const patient = assignments[0].patient;
      if (patient?.projectId && !(await this.projectAccessService.canAccessProject(doctorId, patient.projectId, userRole))) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    if (assignments.length === 0) {
      throw new BadRequestException('Patient has no assignments');
    }

    const allSubmitted = assignments.every(
      (a) => a.status === AssignmentStatus.SUBMITTED,
    );

    if (!allSubmitted) {
      throw new BadRequestException(
        'All tests must be SUBMITTED before signing',
      );
    }

    // Check if review exists
    const review = await this.doctorReviewsRepository.findOne({
      where: { patientId: dto.patientId, doctorId },
    });

    if (!review) {
      throw new BadRequestException(
        'Review must be created before signing the report',
      );
    }

    if (review.isSigned) {
      throw new BadRequestException('Report is already signed');
    }

    // Verify passkey - validate input first
    if (!dto.passkeyCredential || !dto.passkeyCredential.response || !dto.passkeyCredential.response.clientDataJSON) {
      throw new BadRequestException('Invalid passkey credential format. Missing clientDataJSON.');
    }

    // Extract challenge from credential response
    try {
      const clientDataJSON = Buffer.from(
        dto.passkeyCredential.response.clientDataJSON,
        'base64',
      ).toString('utf-8');
      const clientData = JSON.parse(clientDataJSON);
      const expectedChallenge = clientData.challenge;

      // Generate a challenge ID for this signing operation
      // In a real implementation, you'd store this when generating the challenge
      const challengeId = `sign-${doctorId}-${Date.now()}`;

      // For now, we'll need to generate a challenge first
      // This is a simplified flow - in production, you'd store the challenge
      await this.passkeyService.verifyPasskeyForSigning(
        doctorId,
        challengeId,
        dto.passkeyCredential,
        expectedChallenge,
      );

      // Update review
      review.isSigned = true;
      review.signedAt = new Date();
      review.passkeyVerified = true;

      const savedReview = await this.doctorReviewsRepository.save(review);

      // Log audit
      await this.auditService.log(doctorId, 'REPORT_SIGNED', 'DoctorReview', savedReview.id, {
        patientId: dto.patientId,
      });

      // Auto-generate report (don't fail signing if report generation fails)
      try {
        await this.reportsService.generateReport(dto.patientId, doctorId, userRole);
        this.logger.log(`Auto-generated report for patient ${dto.patientId} after signing`);
      } catch (error) {
        // Log error but don't fail signing
        this.logger.error(
          `Failed to auto-generate report for patient ${dto.patientId}: ${error.message}`,
          error.stack,
        );
      }

      return this.mapReviewToDto(savedReview);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Passkey verification failed: ${error.message}`);
    }
  }

  async getSignedReports(
    doctorId: string,
    page: number = 1,
    limit: number = 10,
    dateFrom?: Date,
    dateTo?: Date,
    userRole?: UserRole,
  ): Promise<PaginatedPatientsResponseDto> {
    const skip = (page - 1) * limit;

    let query = this.doctorReviewsRepository
      .createQueryBuilder('review')
      .where('review.doctorId = :doctorId', { doctorId })
      .andWhere('review.isSigned = :isSigned', { isSigned: true })
      .leftJoinAndSelect('review.patient', 'patient')
      .leftJoinAndSelect('patient.patientPackages', 'patientPackage')
      .leftJoinAndSelect('patientPackage.package', 'package');

    if (dateFrom) {
      query = query.andWhere('review.signedAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      query = query.andWhere('review.signedAt <= :dateTo', { dateTo });
    }

    if (userRole && userRole !== UserRole.SUPER_ADMIN) {
      const allowedProjectIds = await this.projectAccessService.getUserProjectIds(doctorId, userRole);
      if (allowedProjectIds.length > 0) {
        query.andWhere('patient.projectId IN (:...allowedProjectIds)', { allowedProjectIds });
      } else {
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0
        };
      }
    }

    const [reviews, total] = await query
      .orderBy('review.signedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const patients: PatientReviewResponseDto[] = [];

    for (const review of reviews) {
      const assignments = await this.assignmentsRepository.find({
        where: { patientId: review.patientId },
      });

      patients.push({
        patient: this.mapPatientToDto(review.patient),
        status: 'SIGNED',
        reviewId: review.id,
        reviewedAt: review.reviewedAt || undefined,
        signedAt: review.signedAt || undefined,
        totalTests: assignments.length,
        submittedTests: assignments.filter(
          (a) => a.status === AssignmentStatus.SUBMITTED,
        ).length,
      });
    }

    const totalPages = Math.ceil(total / limit);

    return {
      data: patients,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async checkReportReadiness(patientId: string): Promise<{
    isReady: boolean;
    details: {
      allAssignmentsSubmitted: boolean;
      allResultsExist: boolean;
      bloodTestCompleted: boolean;
      reviewExists: boolean;
      isSigned: boolean;
    };
  }> {
    // Get all assignments
    const assignments = await this.assignmentsRepository.find({
      where: { patientId },
    });

    const allAssignmentsSubmitted = assignments.every(
      (a) => a.status === AssignmentStatus.SUBMITTED,
    );

    // Check all results exist
    const assignmentIds = assignments.map((a) => a.id);
    const results =
      assignmentIds.length > 0
        ? await this.testResultsRepository.find({
          where: assignmentIds.map((id) => ({ assignmentId: id })),
        })
        : [];
    const allResultsExist = results.length === assignments.length;

    // Check blood sample status if exists
    const bloodSample = await this.bloodSamplesRepository.findOne({
      where: { patientId },
    });
    const bloodTestCompleted = !bloodSample || bloodSample.status === BloodSampleStatus.COMPLETED;

    // Check review exists (any doctor)
    const review = await this.doctorReviewsRepository.findOne({
      where: { patientId },
    });
    const reviewExists = !!review;
    const isSigned = review?.isSigned || false;

    const isReady =
      allAssignmentsSubmitted &&
      allResultsExist &&
      bloodTestCompleted &&
      reviewExists &&
      isSigned;

    return {
      isReady,
      details: {
        allAssignmentsSubmitted,
        allResultsExist,
        bloodTestCompleted,
        reviewExists,
        isSigned,
      },
    };
  }

  private mapPatientToDto(patient: Patient): PatientResponseDto {
    return {
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
  }

  private mapResultToDto(result: TestResult): ResultResponseDto {
    return {
      id: result.id,
      assignmentId: result.assignmentId,
      resultValues: result.resultValues,
      notes: result.notes,
      enteredBy: result.enteredBy,
      enteredAt: result.enteredAt,
      isVerified: result.isVerified,
      verifiedBy: result.verifiedBy,
      verifiedAt: result.verifiedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      assignment: result.assignment
        ? {
          id: result.assignment.id,
          patientId: result.assignment.patientId,
          testId: result.assignment.testId,
          adminId: result.assignment.adminId,
          status: result.assignment.status,
        }
        : undefined,
      test: result.assignment?.test
        ? {
          id: result.assignment.test.id,
          name: result.assignment.test.name,
          category: result.assignment.test.category,
        }
        : undefined,
      patient: result.assignment?.patient
        ? {
          id: result.assignment.patient.id,
          patientId: result.assignment.patient.patientId,
          name: result.assignment.patient.name,
        }
        : undefined,
      enteredByUser: result.enteredByUser
        ? {
          id: result.enteredByUser.id,
          email: result.enteredByUser.email,
          fullName: result.enteredByUser.fullName,
        }
        : undefined,
      verifiedByUser: result.verifiedByUser
        ? {
          id: result.verifiedByUser.id,
          email: result.verifiedByUser.email,
          fullName: result.verifiedByUser.fullName,
        }
        : null,
    };
  }

  private mapAssignmentToDto(assignment: Assignment): AssignmentResponseDto {
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
    };
  }

  private mapBloodSampleToDto(sample: BloodSample): BloodSampleResponseDto {
    return {
      id: sample.id,
      sampleId: sample.sampleId,
      patientId: sample.patientId,
      status: sample.status,
      collectedAt: sample.collectedAt,
      collectedBy: sample.collectedBy,
      testedAt: sample.testedAt || undefined,
      testedBy: sample.testedBy || undefined,
      assignmentId: sample.assignmentId || undefined,
      createdAt: sample.createdAt,
      updatedAt: sample.updatedAt,
      patient: sample.patient
        ? {
          id: sample.patient.id,
          patientId: sample.patient.patientId,
          name: sample.patient.name,
          age: sample.patient.age,
          gender: sample.patient.gender,
          contactNumber: sample.patient.contactNumber,
        }
        : undefined,
      collectedByUser: sample.collectedByUser
        ? {
          id: sample.collectedByUser.id,
          email: sample.collectedByUser.email,
          fullName: sample.collectedByUser.fullName,
        }
        : undefined,
      testedByUser: sample.testedByUser
        ? {
          id: sample.testedByUser.id,
          email: sample.testedByUser.email,
          fullName: sample.testedByUser.fullName,
        }
        : null,
    };
  }

  private mapReviewToDto(review: DoctorReview): ReviewResponseDto {
    return {
      id: review.id,
      patientId: review.patientId,
      doctorId: review.doctorId,
      remarks: review.remarks,
      reviewedAt: review.reviewedAt,
      signedAt: review.signedAt,
      passkeyVerified: review.passkeyVerified,
      isSigned: review.isSigned,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}

