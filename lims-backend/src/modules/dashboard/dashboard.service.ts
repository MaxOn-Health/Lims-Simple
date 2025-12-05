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

    async getStats(userId: string, userRole: UserRole): Promise<DashboardResponseDto> {
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
            this.patientsRepository.count({
                where: { createdAt: MoreThanOrEqual(today) },
            }),
            this.patientsRepository.count({
                where: { createdAt: MoreThanOrEqual(weekAgo) },
            }),
            this.assignmentsRepository.count({
                where: { status: AssignmentStatus.PENDING },
            }),
            this.resultsRepository.count({
                where: { createdAt: MoreThanOrEqual(today) },
            }),
            this.reportsRepository.count({
                where: { status: ReportStatus.PENDING },
            }),
            this.patientsRepository
                .createQueryBuilder('patient')
                .innerJoin('patient.patientPackages', 'pp')
                .where('pp.paymentStatus = :status', { status: PaymentStatus.PENDING })
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
        const roleStats = await this.getRoleSpecificStats(userId, userRole, today);

        // Quick actions based on role
        const quickActions = this.getQuickActions(userRole);

        return { stats, roleStats, quickActions };
    }

    private async getRoleSpecificStats(
        userId: string,
        userRole: UserRole,
        today: Date,
    ): Promise<RoleSpecificStatsDto> {
        const roleStats: RoleSpecificStatsDto = {};

        if (userRole === UserRole.RECEPTIONIST || userRole === UserRole.SUPER_ADMIN) {
            const [registrationsToday, pendingPayments] = await Promise.all([
                this.patientsRepository.count({
                    where: { createdAt: MoreThanOrEqual(today) },
                }),
                this.patientsRepository
                    .createQueryBuilder('patient')
                    .innerJoin('patient.patientPackages', 'pp')
                    .where('pp.paymentStatus = :status', { status: PaymentStatus.PENDING })
                    .getCount(),
            ]);
            roleStats.registrationsToday = registrationsToday;
            roleStats.pendingPayments = pendingPayments;
        }

        if (userRole === UserRole.TEST_TECHNICIAN || userRole === UserRole.LAB_TECHNICIAN) {
            const [myPendingTasks, myCompletedToday] = await Promise.all([
                this.assignmentsRepository.count({
                    where: {
                        adminId: userId,
                        status: AssignmentStatus.PENDING,
                    },
                }),
                this.resultsRepository.count({
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
                this.reportsRepository.count({
                    where: { status: ReportStatus.PENDING },
                }),
                this.reportsRepository.count({
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
