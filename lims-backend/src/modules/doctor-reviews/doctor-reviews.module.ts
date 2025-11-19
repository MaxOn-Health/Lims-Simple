import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorReview } from './entities/doctor-review.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { TestResult } from '../results/entities/test-result.entity';
import { BloodSample } from '../blood-samples/entities/blood-sample.entity';
import { DoctorReviewsService } from './doctor-reviews.service';
import { DoctorReviewsController } from './doctor-reviews.controller';
import { ReportReadinessService } from './services/report-readiness.service';
import { PatientsModule } from '../patients/patients.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { ResultsModule } from '../results/results.module';
import { BloodSamplesModule } from '../blood-samples/blood-samples.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DoctorReview,
      Patient,
      Assignment,
      TestResult,
      BloodSample,
    ]),
    PatientsModule,
    AssignmentsModule,
    ResultsModule,
    BloodSamplesModule,
    AuditModule,
    AuthModule,
    forwardRef(() => ReportsModule),
  ],
  controllers: [DoctorReviewsController],
  providers: [DoctorReviewsService, ReportReadinessService],
  exports: [DoctorReviewsService, TypeOrmModule],
})
export class DoctorReviewsModule {}

