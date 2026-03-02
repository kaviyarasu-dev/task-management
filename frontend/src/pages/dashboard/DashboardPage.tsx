import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  History,
  CheckCircle,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth';
import { useProjects } from '@/features/projects/hooks/useProjects';
import {
  useTaskMetrics,
  useVelocity,
  useUserProductivity,
  TaskStatusChart,
  TaskTrendChart,
  ProductivityChart,
  PriorityDistribution,
} from '@/features/analytics';
import { StatsCard } from '@/shared/components/StatsCard';
import { ROUTES } from '@/shared/constants/routes';
import { formatRelativeTime } from '@/shared/lib/utils';
import { ActivityList, useRecentActivities, useActivityRealtime } from '@/features/activity';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { data: projectsData, isLoading: isLoadingProjects } = useProjects({ limit: 5 });
  const { data: recentActivities, isLoading: isLoadingActivities } = useRecentActivities(10);

  // Analytics hooks
  const { data: metrics, isLoading: isLoadingMetrics } = useTaskMetrics();
  const { data: velocity, isLoading: isLoadingVelocity } = useVelocity('weekly');
  const { data: productivity, isLoading: isLoadingProductivity } = useUserProductivity();

  // Enable real-time activity updates
  useActivityRealtime();

  const recentProjects = projectsData?.pages[0]?.data ?? [];
  const totalProjects = projectsData?.pages[0]?.total ?? 0;

  // Calculate due this week (tasks not completed with due dates within 7 days)
  const activeTasks = metrics?.totalTasks ?? 0;
  const completedTasks = metrics?.completedTasks ?? 0;
  const overdueCount = metrics?.overdueCount ?? 0;

  // Check if user has admin/owner role for productivity chart
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s what&apos;s happening with your projects.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Tasks"
          value={activeTasks - completedTasks}
          icon={CheckSquare}
          isLoading={isLoadingMetrics}
        />
        <StatsCard
          title="Completed"
          value={completedTasks}
          icon={CheckCircle}
          variant="success"
          isLoading={isLoadingMetrics}
        />
        <StatsCard
          title="Total Projects"
          value={totalProjects}
          icon={FolderKanban}
          variant="info"
          isLoading={isLoadingProjects}
        />
        <StatsCard
          title="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          variant="warning"
          isLoading={isLoadingMetrics}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TaskStatusChart
          data={metrics?.statusDistribution ?? []}
          isLoading={isLoadingMetrics}
        />
        <TaskTrendChart
          data={velocity?.data ?? []}
          period={velocity?.period}
          averageVelocity={velocity?.averageVelocity}
          isLoading={isLoadingVelocity}
        />
      </div>

      {/* Priority Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PriorityDistribution
          data={metrics?.priorityDistribution ?? []}
          isLoading={isLoadingMetrics}
        />
        {/* Show productivity chart only for admins/owners */}
        {isAdmin && (
          <ProductivityChart
            data={productivity ?? []}
            isLoading={isLoadingProductivity}
          />
        )}
      </div>

      {/* Two column layout for projects and activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="font-semibold text-foreground">Recent Projects</h2>
            <Link
              to={ROUTES.PROJECTS}
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoadingProjects ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : recentProjects.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No projects yet</p>
              <Link
                to={ROUTES.PROJECTS}
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                Create your first project
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentProjects.map((project) => (
                <li key={project._id}>
                  <Link
                    to={ROUTES.PROJECT_DETAIL.replace(':projectId', project._id)}
                    className="flex items-center justify-between p-4 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {project.color && (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{project.name}</p>
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeTime(project.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Recent Activity</h2>
            </div>
          </div>

          <div className="p-4">
            <ActivityList
              activities={recentActivities ?? []}
              isLoading={isLoadingActivities}
              emptyMessage="No recent activity"
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}
