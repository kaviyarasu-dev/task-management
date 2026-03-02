import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  TaskFormModal,
  TaskRow,
  TaskDetailModal,
} from '@/features/tasks';
import type { Task } from '@/shared/types/entities.types';
import { useProjects } from '@/features/projects';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';

interface ProjectTaskListProps {
  projectId: string;
}

export function ProjectTaskList({ projectId }: ProjectTaskListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTasks({
    projectId,
    limit: 20,
  });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: projectsData } = useProjects();

  const tasks = data?.pages.flatMap((page) => page.data) || [];
  const projects = projectsData?.pages.flatMap((p) => p.data) || [];

  const handleCreateTask = (formData: {
    title: string;
    description?: string;
    projectId: string;
    statusId?: string;
    priority?: string;
    dueDate?: string;
    tags?: string;
    assigneeId?: string | null;
  }) => {
    createTask.mutate(
      {
        title: formData.title,
        description: formData.description,
        projectId,
        statusId: formData.statusId,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        dueDate: formData.dueDate || undefined,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        assigneeId: formData.assigneeId || undefined,
      },
      {
        onSuccess: () => setShowCreateModal(false),
      }
    );
  };

  const handleUpdateTask = (formData: {
    title: string;
    description?: string;
    projectId: string;
    statusId?: string;
    priority?: string;
    dueDate?: string;
    tags?: string;
    assigneeId?: string | null;
  }) => {
    if (!editingTask) return;

    updateTask.mutate(
      {
        taskId: editingTask._id,
        data: {
          title: formData.title,
          description: formData.description,
          statusId: formData.statusId,
          priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
          dueDate: formData.dueDate || undefined,
          tags: formData.tags
            ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
            : undefined,
          assigneeId: formData.assigneeId || undefined,
        },
      },
      {
        onSuccess: () => setEditingTask(null),
      }
    );
  };

  const handleStatusChange = (taskId: string, statusId: string) => {
    updateTask.mutate({ taskId, data: { statusId } });
  };

  const handleDeleteTask = () => {
    if (!taskToDelete) return;
    deleteTask.mutate(taskToDelete._id, {
      onSuccess: () => setTaskToDelete(null),
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium">Tasks ({tasks.length})</h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-muted-foreground">No tasks in this project</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Create your first task
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-muted-foreground">
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Due Date</th>
                  <th className="px-4 py-2">Assignee</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <TaskRow
                    key={task._id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onEdit={(t) => setEditingTask(t)}
                    onDelete={(t) => setTaskToDelete(t)}
                    onView={(t) => setSelectedTask(t)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="mt-4 w-full rounded-md border border-border py-2 text-sm hover:bg-muted disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load more'}
            </button>
          )}
        </>
      )}

      {/* Create Task Modal */}
      <TaskFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTask}
        task={null}
        projects={projects}
        isLoading={createTask.isPending}
      />

      {/* Edit Task Modal */}
      <TaskFormModal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleUpdateTask}
        task={editingTask}
        projects={projects}
        isLoading={updateTask.isPending}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onEdit={(task) => {
          setSelectedTask(null);
          setEditingTask(task);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive
        isLoading={deleteTask.isPending}
      />
    </div>
  );
}
