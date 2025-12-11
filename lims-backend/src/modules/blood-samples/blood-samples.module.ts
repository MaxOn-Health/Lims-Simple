import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloodSample } from './entities/blood-sample.entity';
import { BloodSampleAccess } from './entities/blood-sample-access.entity';
import { SampleEvent } from './entities/sample-event.entity';
import { BloodSamplesService } from './blood-samples.service';
import { BloodSamplesController } from './blood-samples.controller';
import { SampleIdService } from './services/sample-id.service';
import { PasscodeService } from './services/passcode.service';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { Test } from '../tests/entities/test.entity';
import { TestResult } from '../results/entities/test-result.entity';
import { ResultValidationService } from '../results/services/result-validation.service';
import { AuditModule } from '../audit/audit.module';
import { ResultsModule } from '../results/results.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BloodSample,
      BloodSampleAccess,
      SampleEvent,
      Patient,
      User,
      Assignment,
      Test,
      TestResult,
    ]),
    AuditModule,
    ResultsModule, // For ResultValidationService
    ProjectsModule,
  ],
  providers: [BloodSamplesService, SampleIdService, PasscodeService],
  controllers: [BloodSamplesController],
  exports: [BloodSamplesService, TypeOrmModule],
})
export class BloodSamplesModule { }






