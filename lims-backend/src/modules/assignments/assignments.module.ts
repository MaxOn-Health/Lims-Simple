import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './entities/assignment.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { AdminSelectionService } from './services/admin-selection.service';
import { Patient } from '../patients/entities/patient.entity';
import { PatientPackage } from '../patients/entities/patient-package.entity';
import { Test } from '../tests/entities/test.entity';
import { Package } from '../packages/entities/package.entity';
import { PackageTest } from '../packages/entities/package-test.entity';
import { User } from '../users/entities/user.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assignment,
      Patient,
      PatientPackage,
      Test,
      Package,
      PackageTest,
      User,
    ]),
    AuditModule,
  ],
  providers: [AssignmentsService, AdminSelectionService],
  controllers: [AssignmentsController],
  exports: [AssignmentsService, AdminSelectionService],
})
export class AssignmentsModule { }

