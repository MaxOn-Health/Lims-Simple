import apiClient from './api.client';

export interface DashboardStats {
    patientsToday: number;
    pendingTests: number;
    completedResults: number;
    reportsAwaitingReview: number;
    patientsThisWeek: number;
    paymentsPending: number;
}

export interface RoleSpecificStats {
    registrationsToday?: number;
    pendingPayments?: number;
    myPendingTasks?: number;
    myCompletedToday?: number;
    reportsToReview?: number;
    reportsSigned?: number;
}

export interface QuickAction {
    label: string;
    href: string;
    description: string;
}

export interface DashboardResponse {
    stats: DashboardStats;
    roleStats: RoleSpecificStats;
    quickActions: QuickAction[];
}

export const dashboardService = {
    async getStats(projectId?: string): Promise<DashboardResponse> {
        const params = projectId ? { projectId } : {};
        const response = await apiClient.get<DashboardResponse>('/dashboard/stats', { params });
        return response.data;
    },
};
