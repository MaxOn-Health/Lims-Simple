import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestResult } from './entities/test-result.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { AssignmentStatus } from '../assignments/constants/assignment-status.enum';
import { User, UserRole } from '../users/entities/user.entity';
import { SubmitResultDto } from './dto/submit-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { ResultResponseDto } from './dto/result-response.dto';
import { ResultValidationService } from './services/result-validation.service';
import { AuditService } from '../audit/audit.service';
import { ProjectAccessService } from '../../common/services/project-access.service';
import { DoctorReview } from '../doctor-reviews/entities/doctor-review.entity';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(TestResult)
    private testResultsRepository: Repository<TestResult>,
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(DoctorReview)
    private doctorReviewsRepository: Repository<DoctorReview>,
    private resultValidationService: ResultValidationService,
    private auditService: AuditService,
    private projectAccessService: ProjectAccessService,
  ) { }

  async submitResult(dto: SubmitResultDto, currentUser: { id: string, role: string }): Promise<ResultResponseDto> {
    const userId = currentUser.id;
    // Get assignment with test
    const assignment = await this.assignmentsRepository.findOne({
      where: { id: dto.assignmentId },
      relations: ['test', 'admin', 'patient'],
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${dto.assignmentId} not found`);
    }

    if (assignment.patient?.projectId && !(await this.projectAccessService.canAccessProject(userId, assignment.patient.projectId, currentUser.role as UserRole))) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Validate assignment belongs to current user
    if (assignment.adminId !== userId) {
      throw new ForbiddenException('You can only submit results for your own assignments');
    }

    // Validate assignment status allows result submission (IN_PROGRESS or ASSIGNED)
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
      where: { assignmentId: dto.assignmentId },
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
      assignmentId: dto.assignmentId,
      resultValues: dto.resultValues,
      notes: dto.notes || null,
      enteredBy: userId,
      enteredAt: new Date(),
      isVerified: false,
      verifiedBy: null,
      verifiedAt: null,
    });

    const savedResult = await this.testResultsRepository.save(testResult);

    // Update assignment status to SUBMITTED
    assignment.status = AssignmentStatus.SUBMITTED;
    await this.assignmentsRepository.save(assignment);

    // Log action
    await this.auditService.log(
      userId,
      'RESULT_SUBMITTED',
      'TestResult',
      savedResult.id,
      {
        assignmentId: dto.assignmentId,
        testId: assignment.testId,
        patientId: assignment.patientId,
        warnings: validation.warnings,
      },
    );

    // Get result with relations for response
    const resultWithRelations = await this.testResultsRepository.findOne({
      where: { id: savedResult.id },
      relations: ['assignment', 'assignment.test', 'assignment.patient', 'enteredByUser', 'verifiedByUser'],
    });

    const response = this.mapToResponseDto(resultWithRelations!);
    if (validation.warnings.length > 0) {
      response.warnings = validation.warnings;
    }

    return response;
  }

  async editResult(resultId: string, dto: UpdateResultDto, currentUser: { id: string, role: string }): Promise<ResultResponseDto> {
    const userId = currentUser.id;

    // Get existing result with assignment, test, and patient
    const result = await this.testResultsRepository.findOne({
      where: { id: resultId },
      relations: ['assignment', 'assignment.test', 'assignment.patient', 'enteredByUser', 'verifiedByUser'],
    });

    if (!result) {
      throw new NotFoundException(`Result with ID ${resultId} not found`);
    }

    // BLOCK: Cannot edit verified results
    if (result.isVerified) {
      throw new BadRequestException('Cannot edit verified results. Contact admin for changes.');
    }

    // BLOCK: Only original technician or SUPER_ADMIN can edit
    if (result.enteredBy !== userId) {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only the original technician can edit this result');
      }
    }

    // Validate assignment status allows editing (must be SUBMITTED)
    if (result.assignment.status !== AssignmentStatus.SUBMITTED) {
      throw new BadRequestException(
        `Cannot edit result. Assignment must be in SUBMITTED status. Current status: ${result.assignment.status}`
      );
    }

    // Validate editReason is provided
    if (!dto.editReason || dto.editReason.trim() === '') {
      throw new BadRequestException('Edit reason is required when editing a result');
    }

    // Store old values for audit
    const oldValues = {
      resultValues: { ...result.resultValues },
      notes: result.notes,
    };

    // Validate new result values if provided
    if (dto.resultValues) {
      const validation = this.resultValidationService.validateResultValues(
        result.assignment.test.testFields,
        dto.resultValues,
        null,
        null,
      );

      if (!validation.isValid) {
        throw new BadRequestException(`Validation failed: ${validation.errors.join('; ')}`);
      }

      result.resultValues = dto.resultValues;
    }

    if (dto.notes !== undefined) {
      result.notes = dto.notes || null;
    }

    // Update edit tracking fields
    result.isEdited = true;
    result.editedAt = new Date();
    result.editedBy = userId;
    result.editReason = dto.editReason;

    const updatedResult = await this.testResultsRepository.save(result);

    // Update assignment status back to COMPLETED to allow re-submission
    result.assignment.status = AssignmentStatus.COMPLETED;
    await this.assignmentsRepository.save(result.assignment);

    // Log the edit with before/after values
    await this.auditService.log(
      userId,
      'RESULT_EDITED',
      'TestResult',
      result.id,
      {
        oldValues,
        newValues: {
          resultValues: updatedResult.resultValues,
          notes: updatedResult.notes,
        },
        editReason: dto.editReason,
        assignmentId: result.assignmentId,
        patientId: result.assignment.patientId,
      },
    );

    // Check if doctor review exists and notify
    const doctorReview = await this.doctorReviewsRepository.findOne({
      where: { patientId: result.assignment.patientId },
    });

    if (doctorReview) {
      // Log that doctor needs to re-review
      await this.auditService.log(
        userId,
        'RESULT_EDITED_REVIEW_NEEDED',
        'TestResult',
        result.id,
        {
          patientId: result.assignment.patientId,
          doctorReviewId: doctorReview.id,
          editReason: dto.editReason,
        },
      );

      // Note: In a real system, you might want to:
      // - Send email/notification to the doctor
      // - Set a flag on the doctor review indicating it needs re-review
      // - Reset the isSigned flag on the doctor review
    }

    return this.mapToResponseDto(updatedResult);
  }

  async findByAssignment(assignmentId: string, currentUser?: { id: string, role: string }): Promise<ResultResponseDto> {
    const result = await this.testResultsRepository.findOne({
      where: { assignmentId },
      relations: ['assignment', 'assignment.test', 'assignment.patient', 'enteredByUser', 'verifiedByUser'],
    });

    if (!result) {
      throw new NotFoundException(`Result for assignment ${assignmentId} not found`);
    }

    if (result.assignment?.patient?.projectId && currentUser && !(await this.projectAccessService.canAccessProject(currentUser.id, result.assignment.patient.projectId, currentUser.role as UserRole))) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.mapToResponseDto(result);
  }

  async findByPatient(patientId: string, currentUser?: { id: string, role: string }): Promise<ResultResponseDto[]> {
    // Check access to patient first
    const patientProject = await this.assignmentsRepository.manager.query(`SELECT "projectId" FROM patients WHERE id = $1`, [patientId]);
    if (patientProject.length > 0 && patientProject[0].projectId && currentUser && !(await this.projectAccessService.canAccessProject(currentUser.id, patientProject[0].projectId, currentUser.role as UserRole))) {
      // Alternatively return empty array or throw Forbidden
      // Usually return empty for list queries, but findByPatient is specific target?
      // If I specifically ask for a patient I shouldn't see, Forbidden is appropriate.
      throw new ForbiddenException('You do not have access to this patient project');
    }
    // Get all assignments for patient
    const assignments = await this.assignmentsRepository.find({
      where: { patientId },
      select: ['id'],
    });

    const assignmentIds = assignments.map((a) => a.id);

    if (assignmentIds.length === 0) {
      return [];
    }

    // Get all results for these assignments
    const results = await this.testResultsRepository.find({
      where: assignmentIds.map((id) => ({ assignmentId: id })),
      relations: ['assignment', 'assignment.test', 'assignment.patient', 'enteredByUser', 'verifiedByUser'],
      order: { enteredAt: 'DESC' },
    });

    return results.map((result) => this.mapToResponseDto(result));
  }

  async findOne(id: string, currentUser?: { id: string, role: string }): Promise<ResultResponseDto> {
    const result = await this.testResultsRepository.findOne({
      where: { id },
      relations: ['assignment', 'assignment.test', 'assignment.patient', 'enteredByUser', 'verifiedByUser'],
    });

    if (!result) {
      throw new NotFoundException(`Result with ID ${id} not found`);
    }

    if (result.assignment?.patient?.projectId && currentUser && !(await this.projectAccessService.canAccessProject(currentUser.id, result.assignment.patient.projectId, currentUser.role as UserRole))) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return this.mapToResponseDto(result);
  }

  async updateResult(id: string, dto: UpdateResultDto, userId: string): Promise<ResultResponseDto> {
    // Check user is SUPER_ADMIN
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can update results');
    }

    // Get existing result with assignment and test
    const result = await this.testResultsRepository.findOne({
      where: { id },
      relations: ['assignment', 'assignment.test', 'assignment.patient', 'enteredByUser', 'verifiedByUser'],
    });

    if (!result) {
      throw new NotFoundException(`Result with ID ${id} not found`);
    }

    // Store old values for audit
    const oldValues = {
      resultValues: { ...result.resultValues },
      notes: result.notes,
    };

    // Validate new result values if provided
    if (dto.resultValues) {
      const validation = this.resultValidationService.validateResultValues(
        result.assignment.test.testFields,
        dto.resultValues,
        null,
        null,
      );

      if (!validation.isValid) {
        throw new BadRequestException(`Validation failed: ${validation.errors.join('; ')}`);
      }

      result.resultValues = dto.resultValues;
    }

    if (dto.notes !== undefined) {
      result.notes = dto.notes || null;
    }

    // Set verified_at timestamp
    result.verifiedAt = new Date();

    const updatedResult = await this.testResultsRepository.save(result);

    // Log changes
    await this.auditService.log(
      userId,
      'RESULT_UPDATED',
      'TestResult',
      result.id,
      {
        oldValues,
        newValues: {
          resultValues: updatedResult.resultValues,
          notes: updatedResult.notes,
        },
        assignmentId: result.assignmentId,
        patientId: result.assignment.patientId,
      },
    );

    return this.mapToResponseDto(updatedResult);
  }

  async verifyResult(id: string, userId: string): Promise<ResultResponseDto> {
    // Check user is SUPER_ADMIN
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can verify results');
    }

    const result = await this.testResultsRepository.findOne({
      where: { id },
      relations: ['assignment', 'assignment.test', 'assignment.patient', 'enteredByUser', 'verifiedByUser'],
    });

    if (!result) {
      throw new NotFoundException(`Result with ID ${id} not found`);
    }

    result.isVerified = true;
    result.verifiedBy = userId;
    result.verifiedAt = new Date();

    const verifiedResult = await this.testResultsRepository.save(result);

    // Log action
    await this.auditService.log(userId, 'RESULT_VERIFIED', 'TestResult', result.id, {
      assignmentId: result.assignmentId,
      patientId: result.assignment.patientId,
    });

    return this.mapToResponseDto(verifiedResult);
  }

  private mapToResponseDto(result: TestResult): ResultResponseDto {
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
      isEdited: result.isEdited,
      editedAt: result.editedAt,
      editedBy: result.editedBy,
      editReason: result.editReason,
    };
  }
}

