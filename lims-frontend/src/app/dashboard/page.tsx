'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '@/components/layouts/MainLayout/MainLayout';
import { useAuthStore } from '@/store/auth.store';
import { dashboardService, DashboardResponse } from '@/services/api/dashboard.service';
import { Skeleton } from '@/components/common/Skeleton';
import { ProjectSelector } from '@/components/common/ProjectSelector/ProjectSelector';
import { useProjectFilter } from '@/hooks/useProjectFilter';
import Link from 'next/link';
import {
  Users,
  FlaskConical,
  CheckCircle2,
  FileText,
  CreditCard,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { UserRole } from '@/types/user.types';
import { MyAssignmentsDashboard } from '@/components/assignments/MyAssignmentsDashboard/MyAssignmentsDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { selectedProjectId, setSelectedProjectId, projects, isLoading: projectsLoading } = useProjectFilter();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await dashboardService.getStats(selectedProjectId);
        setData(response);
      } catch (err) {
        setError('Failed to load dashboard stats');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (!projectsLoading) {
      fetchStats();
    }
  }, [selectedProjectId, projectsLoading]);

  // If user is a technician or doctor who primarily deals with assignments, show that dashboard
  if (user && (user.role === UserRole.TEST_TECHNICIAN || user.role === UserRole.LAB_TECHNICIAN)) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <MyAssignmentsDashboard />
        </MainLayout>
      </ProtectedRoute>
    );
  }

  const statCards = data ? [
    {
      label: 'Patients Today',
      value: data.stats.patientsToday,
      icon: Users,
      color: 'bg-blue-500',
      trend: `${data.stats.patientsThisWeek} this week`,
    },
    {
      label: 'Pending Tests',
      value: data.stats.pendingTests,
      icon: FlaskConical,
      color: 'bg-yellow-500',
    },
    {
      label: 'Results Completed',
      value: data.stats.completedResults,
      icon: CheckCircle2,
      color: 'bg-green-500',
      trend: 'Today',
    },
    {
      label: 'Reports to Review',
      value: data.stats.reportsAwaitingReview,
      icon: FileText,
      color: 'bg-purple-500',
    },
    {
      label: 'Payments Pending',
      value: data.stats.paymentsPending,
      icon: CreditCard,
      color: 'bg-red-500',
    },
  ] : [];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back, {user?.fullName} 👋
              </p>
            </div>
            <ProjectSelector
              selectedProjectId={selectedProjectId}
              onSelect={setSelectedProjectId}
              projects={projects}
              showAllOption
            />
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} height="h-28" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        <p className="mt-1 text-3xl font-bold text-gray-900">{stat.value}</p>
                        {stat.trend && (
                          <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {stat.trend}
                          </p>
                        )}
                      </div>
                      <div className={`${stat.color} p-3 rounded-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          {data && data.quickActions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.quickActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
                  >
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-primary-700">
                        {action.label}
                      </p>
                      <p className="text-sm text-gray-500">{action.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Role-specific Stats */}
          {data && Object.keys(data.roleStats).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Activity</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {data.roleStats.registrationsToday !== undefined && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{data.roleStats.registrationsToday}</p>
                    <p className="text-sm text-blue-600/70">Registered Today</p>
                  </div>
                )}
                {data.roleStats.pendingPayments !== undefined && (
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{data.roleStats.pendingPayments}</p>
                    <p className="text-sm text-yellow-600/70">Pending Payments</p>
                  </div>
                )}
                {data.roleStats.myPendingTasks !== undefined && (
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{data.roleStats.myPendingTasks}</p>
                    <p className="text-sm text-orange-600/70">My Pending Tasks</p>
                  </div>
                )}
                {data.roleStats.myCompletedToday !== undefined && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{data.roleStats.myCompletedToday}</p>
                    <p className="text-sm text-green-600/70">Completed Today</p>
                  </div>
                )}
                {data.roleStats.reportsToReview !== undefined && (
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{data.roleStats.reportsToReview}</p>
                    <p className="text-sm text-purple-600/70">To Review</p>
                  </div>
                )}
                {data.roleStats.reportsSigned !== undefined && (
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <p className="text-2xl font-bold text-teal-600">{data.roleStats.reportsSigned}</p>
                    <p className="text-sm text-teal-600/70">Signed Today</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Card */}
          {user && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.fullName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.role}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive !== false
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
