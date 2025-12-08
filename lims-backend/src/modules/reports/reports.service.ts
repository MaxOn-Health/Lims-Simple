import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { ReportStatus } from './constants/report-status.enum';
import { ReportNumberService } from './services/report-number.service';
import { PdfGenerationService, ReportData } from './services/pdf-generation.service';
import { FileStorageService } from './services/file-storage.service';
import { Patient } from '../patients/entities/patient.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { AssignmentStatus } from '../assignments/constants/assignment-status.enum';
import { TestResult } from '../results/entities/test-result.entity';
import { DoctorReview } from '../doctor-reviews/entities/doctor-review.entity';
import { AuditService } from '../audit/audit.service';
import { ReportResponseDto } from './dto/report-response.dto';
import { QueryReportsDto } from './dto/query-reports.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(Assignment)
    private assignmentsRepository: Repository<Assignment>,
    @InjectRepository(TestResult)
    private testResultsRepository: Repository<TestResult>,
    @InjectRepository(DoctorReview)
    private doctorReviewsRepository: Repository<DoctorReview>,
    private reportNumberService: ReportNumberService,
    private pdfGenerationService: PdfGenerationService,
    private fileStorageService: FileStorageService,
    private auditService: AuditService,
  ) { }

  async generateReport(
    patientId: string,
    generatedBy: string,
  ): Promise<ReportResponseDto> {
    // Validate all tests are SUBMITTED
    const assignments = await this.assignmentsRepository.find({
      where: { patientId },
    });

    if (assignments.length === 0) {
      throw new BadRequestException('Patient has no assignments');
    }

    // Check if at least one test is SUBMITTED
    const submittedAssignments = assignments.filter(
      (a) => a.status === AssignmentStatus.SUBMITTED,
    );

    if (submittedAssignments.length === 0) {
      throw new BadRequestException(
        'At least one test must be SUBMITTED before generating a report',
      );
    }

    // Validate doctor review exists and is signed
    const review = await this.doctorReviewsRepository.findOne({
      where: { patientId },
      relations: ['doctor'],
    });

    if (!review) {
      throw new BadRequestException(
        'Doctor review must exist before generating a report',
      );
    }

    if (!review.isSigned) {
      throw new BadRequestException(
        'Doctor review must be signed before generating a report',
      );
    }

    // Check if report already exists
    const existingReport = await this.reportsRepository.findOne({
      where: { patientId },
    });

    if (existingReport && existingReport.status === ReportStatus.COMPLETED) {
      return this.mapToDto(existingReport);
    }

    // Create report record (status: GENERATING)
    const reportNumber = await this.reportNumberService.generateReportNumber();
    const report = this.reportsRepository.create({
      patientId,
      reportNumber,
      doctorReviewId: review.id,
      status: ReportStatus.GENERATING,
      generatedBy,
    });

    const savedReport = await this.reportsRepository.save(report);

    try {
      // Collect all data
      const reportData = await this.collectReportData(patientId, review);

      // Generate PDF
      const pdfBuffer = await this.pdfGenerationService.generatePdf({
        ...reportData,
        reportNumber,
        generatedAt: new Date(),
      });

      // Save PDF to storage
      const pdfUrl = await this.fileStorageService.savePdf(
        reportNumber,
        pdfBuffer,
      );

      // Update report (status: COMPLETED, pdf_url)
      savedReport.status = ReportStatus.COMPLETED;
      savedReport.pdfUrl = pdfUrl;
      savedReport.generatedAt = new Date();

      const completedReport = await this.reportsRepository.save(savedReport);

      // Log audit action
      await this.auditService.log(
        generatedBy,
        'REPORT_GENERATED',
        'Report',
        completedReport.id,
        {
          patientId,
          reportNumber,
        },
      );

      return this.mapToDto(completedReport);
    } catch (error) {
      // Set status to FAILED if error
      savedReport.status = ReportStatus.FAILED;
      await this.reportsRepository.save(savedReport);

      this.logger.error(
        `Failed to generate report for patient ${patientId}: ${error.message}`,
        error.stack,
      );

      throw new BadRequestException(
        `Failed to generate report: ${error.message}`,
      );
    }
  }

  private async collectReportData(
    patientId: string,
    review: DoctorReview,
  ): Promise<Omit<ReportData, 'reportNumber' | 'generatedAt'>> {
    // Get patient with packages
    const patient = await this.patientsRepository.findOne({
      where: { id: patientId },
      relations: ['patientPackages', 'patientPackages.package'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    // Get all assignments with test info (only SUBMITTED)
    const assignments = await this.assignmentsRepository.find({
      where: {
        patientId,
        status: AssignmentStatus.SUBMITTED
      },
      relations: ['test'],
      order: { createdAt: 'ASC' },
    });

    // Get all test results
    const assignmentIds = assignments.map((a) => a.id);
    const results =
      assignmentIds.length > 0
        ? await this.testResultsRepository.find({
          where: assignmentIds.map((id) => ({ assignmentId: id })),
          relations: ['assignment', 'assignment.test'],
        })
        : [];

    // Map results to report format
    const testResults = assignments.map((assignment) => {
      const result = results.find((r) => r.assignmentId === assignment.id);
      const test = assignment.test;

      return {
        testName: test.name,
        resultValues: result?.resultValues || {},
        normalRange:
          test.normalRangeMin !== null || test.normalRangeMax !== null
            ? {
              min: test.normalRangeMin
                ? parseFloat(test.normalRangeMin.toString())
                : undefined,
              max: test.normalRangeMax
                ? parseFloat(test.normalRangeMax.toString())
                : undefined,
              unit: test.unit || undefined,
            }
            : undefined,
        status: this.determineStatus(result, test),
        notes: result?.notes || undefined,
      };
    });

    // Get package info
    const patientPackage =
      patient.patientPackages && patient.patientPackages.length > 0
        ? patient.patientPackages[0]
        : null;

    // Get doctor info
    const doctorReview = await this.doctorReviewsRepository.findOne({
      where: { id: review.id },
      relations: ['doctor'],
    });

    return {
      patient: {
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        contactNumber: patient.contactNumber,
        email: patient.email || undefined,
        employeeId: patient.employeeId || undefined,
        companyName: patient.companyName || undefined,
        patientId: patient.patientId,
      },
      package: patientPackage
        ? {
          name: (patientPackage.package as any)?.name || 'N/A',
          validityPeriod: (patientPackage.package as any)?.validityDays || undefined,
        }
        : undefined,
      testResults,
      doctorReview: {
        remarks: review.remarks || undefined,
        doctorName: doctorReview?.doctor?.fullName || undefined,
        signedAt: review.signedAt || undefined,
      },
    };
  }

  private determineStatus(
    result: TestResult | undefined,
    test: any,
  ): string | undefined {
    if (!result || !test.normalRangeMin || !test.normalRangeMax) {
      return undefined;
    }

    // Check if any numeric value in resultValues is outside normal range
    const min = parseFloat(test.normalRangeMin.toString());
    const max = parseFloat(test.normalRangeMax.toString());

    for (const [key, value] of Object.entries(result.resultValues)) {
      const numValue = parseFloat(String(value));
      if (!isNaN(numValue)) {
        if (numValue < min || numValue > max) {
          return 'Abnormal';
        }
      }
    }

    return 'Normal';
  }

  async findByPatient(patientId: string): Promise<ReportResponseDto | null> {
    const report = await this.reportsRepository.findOne({
      where: { patientId },
      relations: ['patient', 'doctorReview', 'generatedByUser'],
      order: { createdAt: 'DESC' },
    });

    if (!report) {
      return null;
    }

    return this.mapToDto(report);
  }

  async findById(id: string): Promise<ReportResponseDto> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: ['patient', 'doctorReview', 'generatedByUser'],
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    return this.mapToDto(report);
  }

  async findAll(queryDto: QueryReportsDto): Promise<{
    data: ReportResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, status, dateFrom, dateTo, patientId } =
      queryDto;

    const queryBuilder = this.reportsRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.patient', 'patient')
      .leftJoinAndSelect('report.doctorReview', 'doctorReview')
      .leftJoinAndSelect('report.generatedByUser', 'generatedByUser');

    if (status) {
      queryBuilder.andWhere('report.status = :status', { status });
    }

    if (patientId) {
      queryBuilder.andWhere('report.patientId = :patientId', { patientId });
    }

    if (dateFrom) {
      queryBuilder.andWhere('report.createdAt >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      queryBuilder.andWhere('report.createdAt <= :dateTo', {
        dateTo: new Date(dateTo),
      });
    }

    queryBuilder.orderBy('report.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [reports, total] = await queryBuilder.getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data: reports.map((report) => this.mapToDto(report)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  getPdfPath(id: string): string {
    // This will be used by the controller to get the file path
    // We'll fetch the report to get the pdfUrl
    return id; // Return id, controller will fetch and use pdfUrl
  }

  private mapToDto(report: Report): ReportResponseDto {
    return {
      id: report.id,
      patientId: report.patientId,
      reportNumber: report.reportNumber,
      doctorReviewId: report.doctorReviewId,
      status: report.status,
      pdfUrl: report.pdfUrl,
      generatedAt: report.generatedAt,
      generatedBy: report.generatedBy,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      patient: report.patient
        ? {
          id: report.patient.id,
          patientId: report.patient.patientId,
          name: report.patient.name,
        }
        : undefined,
      doctorReview: report.doctorReview
        ? {
          id: report.doctorReview.id,
          remarks: report.doctorReview.remarks,
          signedAt: report.doctorReview.signedAt,
        }
        : undefined,
      generatedByUser: report.generatedByUser
        ? {
          id: report.generatedByUser.id,
          email: report.generatedByUser.email,
          fullName: report.generatedByUser.fullName,
        }
        : undefined,
    };
  }
}






