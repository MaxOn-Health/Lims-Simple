import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { TestResult } from '../results/entities/test-result.entity';
import { DoctorReview } from '../doctor-reviews/entities/doctor-review.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportNumberService } from './services/report-number.service';
import { PdfGenerationService } from './services/pdf-generation.service';
import { FileStorageService } from './services/file-storage.service';
import { PatientsModule } from '../patients/patients.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { ResultsModule } from '../results/results.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Report,
      Patient,
      Assignment,
      TestResult,
      DoctorReview,
    ]),
    AuthModule,
    PatientsModule,
    AssignmentsModule,
    ResultsModule,
    AuditModule,
  ],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportNumberService,
    PdfGenerationService,
    FileStorageService,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}

