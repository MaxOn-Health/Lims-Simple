import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './entities/patient.entity';
import { PatientPackage } from './entities/patient-package.entity';
import { Test } from '../tests/entities/test.entity';
import { Package } from '../packages/entities/package.entity';
import { PackageTest } from '../packages/entities/package-test.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { TestResult } from '../results/entities/test-result.entity';
import { BloodSample } from '../blood-samples/entities/blood-sample.entity';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { PatientIdService } from './services/patient-id.service';
import { PriceCalculationService } from './services/price-calculation.service';
import { PackagesModule } from '../packages/packages.module';
import { TestsModule } from '../tests/tests.module';
import { AuditModule } from '../audit/audit.module';
import { ProjectsModule } from '../projects/projects.module';
import { AssignmentsModule } from '../assignments/assignments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      PatientPackage,
      Test,
      Package,
      PackageTest,
      Assignment,
      TestResult,
      BloodSample,
    ]),
    PackagesModule,
    TestsModule,
    AuditModule,
    ProjectsModule,
    AssignmentsModule,
  ],
  providers: [PatientsService, PatientIdService, PriceCalculationService],
  controllers: [PatientsController],
  exports: [PatientsService, TypeOrmModule],
})
export class PatientsModule {}

