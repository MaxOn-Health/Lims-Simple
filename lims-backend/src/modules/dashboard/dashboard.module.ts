import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Patient } from '../patients/entities/patient.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { TestResult } from '../results/entities/test-result.entity';
import { Report } from '../reports/entities/report.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Patient, Assignment, TestResult, Report]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule { }
