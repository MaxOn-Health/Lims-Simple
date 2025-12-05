import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
    @ApiProperty({ description: 'Total patients registered today' })
    patientsToday: number;

    @ApiProperty({ description: 'Total pending tests' })
    pendingTests: number;

    @ApiProperty({ description: 'Total completed results' })
    completedResults: number;

    @ApiProperty({ description: 'Reports awaiting doctor review' })
    reportsAwaitingReview: number;

    @ApiProperty({ description: 'Total patients this week' })
    patientsThisWeek: number;

    @ApiProperty({ description: 'Payments pending count' })
    paymentsPending: number;
}

export class RoleSpecificStatsDto {
    // Receptionist stats
    @ApiProperty({ required: false })
    registrationsToday?: number;

    @ApiProperty({ required: false })
    pendingPayments?: number;

    // Technician stats
    @ApiProperty({ required: false })
    myPendingTasks?: number;

    @ApiProperty({ required: false })
    myCompletedToday?: number;

    // Doctor stats
    @ApiProperty({ required: false })
    reportsToReview?: number;

    @ApiProperty({ required: false })
    reportsSigned?: number;
}

export class DashboardResponseDto {
    @ApiProperty({ type: DashboardStatsDto })
    stats: DashboardStatsDto;

    @ApiProperty({ type: RoleSpecificStatsDto })
    roleStats: RoleSpecificStatsDto;

    @ApiProperty({ description: 'Quick action suggestions based on role' })
    quickActions: { label: string; href: string; description: string }[];
}
