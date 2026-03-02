import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useProject, useUpdateProject, useDeleteProject } from '@/features/projects';
import { ProjectHeader } from '@/features/projects/components/ProjectHeader';
import { ProjectTabs } from '@/features/projects/components/ProjectTabs';
import { ProjectTaskList } from '@/features/projects/components/ProjectTaskList';
import { ProjectMemberList } from '@/features/projects/components/ProjectMemberList';
import { ProjectSettings } from '@/features/projects/components/ProjectSettings';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { ROUTES } from '@/shared/constants/routes';
import {
  ActivityFeed,
  useProjectActivities,
  useProjectActivityRealtime,
} from '@/features/activity';

type Tab = 'tasks' | 'members' | 'activity' | 'settings';

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: projectResponse, isLoading, error } = useProject(projectId!);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch project activities
  const {
    data: activitiesData,
    isLoading: isLoadingActivities,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchActivities,
  } = useProjectActivities(projectId!, {
    enabled: activeTab === 'activity' && !!projectId,
  });

  // Enable real-time activity updates for this project
  useProjectActivityRealtime(projectId!);

  // Flatten activities from paginated response
  const activities = useMemo(() => {
    return activitiesData?.pages.flatMap((page) => page.data) ?? [];
  }, [activitiesData]);

  const project = projectResponse?.data;

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <button
          onClick={() => navigate(ROUTES.PROJECTS)}
          className="mt-4 text-primary hover:underline"
        >
          Back to projects
        </button>
      </div>
    );
  }

  const handleArchive = async () => {
    await updateProject.mutateAsync({
      projectId: project._id,
      data: { isArchived: !project.isArchived },
    });
    setShowArchiveDialog(false);
  };

  const handleDelete = async () => {
    await deleteProject.mutateAsync(project._id);
    navigate(ROUTES.PROJECTS);
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate(ROUTES.PROJECTS)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </button>

      {/* Project Header */}
      <ProjectHeader
        project={project}
        onArchive={() => setShowArchiveDialog(true)}
        onDelete={() => setShowDeleteDialog(true)}
      />

      {/* Tabs */}
      <ProjectTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        memberCount={project.memberIds?.length || 0}
      />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'tasks' && <ProjectTaskList projectId={project._id} />}
        {activeTab === 'members' && (
          <ProjectMemberList projectId={project._id} memberIds={project.memberIds} />
        )}
        {activeTab === 'activity' && (
          <div className="rounded-lg border border-border bg-background p-6">
            <ActivityFeed
              activities={activities}
              isLoading={isLoadingActivities}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              onLoadMore={() => fetchNextPage()}
              onRefresh={() => refetchActivities()}
              emptyMessage="No activity for this project yet"
            />
          </div>
        )}
        {activeTab === 'settings' && (
          <ProjectSettings
            project={project}
            onUpdate={(data) =>
              updateProject.mutate({ projectId: project._id, data })
            }
            isLoading={updateProject.isPending}
          />
        )}
      </div>

      {/* Archive Dialog */}
      <ConfirmDialog
        isOpen={showArchiveDialog}
        onClose={() => setShowArchiveDialog(false)}
        onConfirm={handleArchive}
        title={project.isArchived ? 'Unarchive Project' : 'Archive Project'}
        message={
          project.isArchived
            ? 'Are you sure you want to unarchive this project? It will be visible in the project list again.'
            : 'Are you sure you want to archive this project? You can restore it later.'
        }
        confirmText={project.isArchived ? 'Unarchive' : 'Archive'}
        isLoading={updateProject.isPending}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone and all tasks will be removed."
        confirmText="Delete"
        isDestructive
        isLoading={deleteProject.isPending}
      />
    </div>
  );
}
