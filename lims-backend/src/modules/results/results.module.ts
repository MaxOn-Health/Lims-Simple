import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestResult } from './entities/test-result.entity';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';
import { ResultValidationService } from './services/result-validation.service';
import { Assignment } from '../assignments/entities/assignment.entity';
import { User } from '../users/entities/user.entity';
import { DoctorReview } from '../doctor-reviews/entities/doctor-review.entity';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TestResult, Assignment, User, DoctorReview]),
    AuditModule,
    ProjectsModule,
  ],
  providers: [ResultsService, ResultValidationService],
  controllers: [ResultsController],
  exports: [ResultsService, ResultValidationService],
})
export class ResultsModule { }

