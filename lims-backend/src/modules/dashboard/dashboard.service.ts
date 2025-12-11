import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { AssignmentStatus } from '../assignments/constants/assignment-status.enum';
import { TestResult } from '../results/entities/test-result.entity';
import { Report } from '../reports/entities/report.entity';
import { ReportStatus } from '../reports/constants/report-status.enum';
import { PaymentStatus } from '../patients/constants/payment-status.enum';
import { UserRole } from '../users/entities/user.entity';
import { DashboardResponseDto, DashboardStatsDto, RoleSpecificStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Patient)
        private patientsRepository: Repository<Patient>,
        @InjectRepository(Assignment)
        private assignmentsRepository: Repository<Assignment>,
        @InjectRepository(TestResult)
        private resultsRepository: Repository<TestResult>,
        @InjectRepository(Report)
        private reportsRepository: Repository<Report>,
    ) { }

    async getStats(userId: string, userRole: UserRole, projectId?: string): Promise<DashboardResponseDto> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        // Common stats
        const [
            patientsToday,
            patientsThisWeek,
            pendingTests,
            completedResults,
            reportsAwaitingReview,
            paymentsPending,
        ] = await Promise.all([
            // Patients Today
            this.patientsRepository.count({
                where: {
                    createdAt: MoreThanOrEqual(today),
                    ...(projectId ? { projectId } : {}),
                },
            }),
            // Patients This Week
            this.patientsRepository.count({
                where: {
                    createdAt: MoreThanOrEqual(weekAgo),
                    ...(projectId ? { projectId } : {}),
                },
            }),
            // Pending Tests (Assignments)
            projectId
                ? this.assignmentsRepository
                    .createQueryBuilder('assignment')
                    .innerJoin('assignment.patient', 'patient')
                    .where('assignment.status = :status', { status: AssignmentStatus.PENDING })
                    .andWhere('patient.projectId = :projectId', { projectId })
                    .getCount()
                : this.assignmentsRepository.count({
                    where: { status: AssignmentStatus.PENDING },
                }),
            // Completed Results
            projectId
                ? this.resultsRepository
                    .createQueryBuilder('result')
                    .innerJoin('result.assignment', 'assignment')
                    .innerJoin('assignment.patient', 'patient')
                    .where('result.createdAt >= :today', { today })
                    .andWhere('patient.projectId = :projectId', { projectId })
                    .getCount()
                : this.resultsRepository.count({
                    where: { createdAt: MoreThanOrEqual(today) },
                }),
            // Reports Awaiting Review
            projectId
                ? this.reportsRepository
                    .createQueryBuilder('report')
                    .innerJoin('report.patient', 'patient')
                    .where('report.status = :status', { status: ReportStatus.PENDING })
                    .andWhere('patient.projectId = :projectId', { projectId })
                    .getCount()
                : this.reportsRepository.count({
                    where: { status: ReportStatus.PENDING },
                }),
            // Payments Pending
            this.patientsRepository
                .createQueryBuilder('patient')
                .innerJoin('patient.patientPackages', 'pp')
                .where('pp.paymentStatus = :status', { status: PaymentStatus.PENDING })
                .andWhere(projectId ? 'patient.projectId = :projectId' : '1=1', { projectId })
                .getCount(),
        ]);

        const stats: DashboardStatsDto = {
            patientsToday,
            patientsThisWeek,
            pendingTests,
            completedResults,
            reportsAwaitingReview,
            paymentsPending,
        };

        // Role-specific stats
        const roleStats = await this.getRoleSpecificStats(userId, userRole, today, projectId);

        // Quick actions based on role
        const quickActions = this.getQuickActions(userRole);

        return { stats, roleStats, quickActions };
    }

    private async getRoleSpecificStats(
        userId: string,
        userRole: UserRole,
        today: Date,
        projectId?: string,
    ): Promise<RoleSpecificStatsDto> {
        const roleStats: RoleSpecificStatsDto = {};

        if (userRole === UserRole.RECEPTIONIST || userRole === UserRole.SUPER_ADMIN) {
            const [registrationsToday, pendingPayments] = await Promise.all([
                this.patientsRepository.count({
                    where: {
                        createdAt: MoreThanOrEqual(today),
                        ...(projectId ? { projectId } : {}),
                    },
                }),
                this.patientsRepository
                    .createQueryBuilder('patient')
                    .innerJoin('patient.patientPackages', 'pp')
                    .where('pp.paymentStatus = :status', { status: PaymentStatus.PENDING })
                    .andWhere(projectId ? 'patient.projectId = :projectId' : '1=1', { projectId })
                    .getCount(),
            ]);
            roleStats.registrationsToday = registrationsToday;
            roleStats.pendingPayments = pendingPayments;
        }

        if (userRole === UserRole.TEST_TECHNICIAN || userRole === UserRole.LAB_TECHNICIAN) {
            const [myPendingTasks, myCompletedToday] = await Promise.all([
                projectId
                    ? this.assignmentsRepository
                        .createQueryBuilder('assignment')
                        .innerJoin('assignment.patient', 'patient')
                        .where('assignment.adminId = :userId', { userId })
                        .andWhere('assignment.status = :status', { status: AssignmentStatus.PENDING })
                        .andWhere('patient.projectId = :projectId', { projectId })
                        .getCount()
                    : this.assignmentsRepository.count({
                        where: {
                            adminId: userId,
                            status: AssignmentStatus.PENDING,
                        },
                    }),
                projectId
                    ? this.resultsRepository
                        .createQueryBuilder('result')
                        .innerJoin('result.assignment', 'assignment')
                        .innerJoin('assignment.patient', 'patient')
                        .where('result.enteredBy = :userId', { userId })
                        .andWhere('result.createdAt >= :today', { today })
                        .andWhere('patient.projectId = :projectId', { projectId })
                        .getCount()
                    : this.resultsRepository.count({
                        where: {
                            enteredBy: userId,
                            createdAt: MoreThanOrEqual(today),
                        },
                    }),
            ]);
            roleStats.myPendingTasks = myPendingTasks;
            roleStats.myCompletedToday = myCompletedToday;
        }

        if (userRole === UserRole.DOCTOR) {
            const [reportsToReview, reportsSigned] = await Promise.all([
                projectId
                    ? this.reportsRepository
                        .createQueryBuilder('report')
                        .innerJoin('report.patient', 'patient')
                        .where('report.status = :status', { status: ReportStatus.PENDING })
                        .andWhere('patient.projectId = :projectId', { projectId })
                        .getCount()
                    : this.reportsRepository.count({
                        where: { status: ReportStatus.PENDING },
                    }),
                projectId
                    ? this.reportsRepository
                        .createQueryBuilder('report')
                        .innerJoin('report.patient', 'patient')
                        .where('report.status = :status', { status: ReportStatus.COMPLETED })
                        .andWhere('report.updatedAt >= :today', { today })
                        .andWhere('patient.projectId = :projectId', { projectId })
                        .getCount()
                    : this.reportsRepository.count({
                        where: {
                            status: ReportStatus.COMPLETED,
                            updatedAt: MoreThanOrEqual(today),
                        },
                    }),
            ]);
            roleStats.reportsToReview = reportsToReview;
            roleStats.reportsSigned = reportsSigned;
        }

        return roleStats;
    }

    private getQuickActions(userRole: UserRole): { label: string; href: string; description: string }[] {
        const actions: { label: string; href: string; description: string }[] = [];

        if (userRole === UserRole.RECEPTIONIST || userRole === UserRole.SUPER_ADMIN) {
            actions.push(
                { label: 'Register Patient', href: '/patients/new', description: 'Add a new patient' },
                { label: 'View Patients', href: '/patients', description: 'See all patients' },
                { label: 'Track Progress', href: '/patients/progress', description: 'Monitor test progress' },
            );
        }

        if (userRole === UserRole.TEST_TECHNICIAN || userRole === UserRole.LAB_TECHNICIAN) {
            actions.push(
                { label: 'My Tasks', href: '/assignments/my-assignments', description: 'View assigned tests' },
                { label: 'Enter Results', href: '/results', description: 'Submit test results' },
            );
        }

        if (userRole === UserRole.DOCTOR) {
            actions.push(
                { label: 'Review Reports', href: '/doctor/dashboard', description: 'Sign pending reports' },
                { label: 'Signed Reports', href: '/doctor/signed-reports', description: 'View completed reports' },
            );
        }

        if (userRole === UserRole.SUPER_ADMIN) {
            actions.push(
                { label: 'Manage Users', href: '/users', description: 'Add or edit users' },
                { label: 'Manage Tests', href: '/tests', description: 'Configure test types' },
            );
        }

        return actions;
    }
}
