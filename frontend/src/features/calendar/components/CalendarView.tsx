import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { Task } from '@/shared/types/entities.types';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { DayDetailPanel } from './DayDetailPanel';
import { useCalendarStore } from '../stores/calendarStore';
import { useCalendarTasks } from '../hooks/useCalendarTasks';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
} from '../types/calendar.types';
import { TaskDetailModal } from '@/features/tasks/components/TaskDetailModal';
import { TaskFormModal } from '@/features/tasks/components/TaskFormModal';
import { useProjects } from '@/features/projects/hooks/useProjects';
import { useCreateTask, useUpdateTask } from '@/features/tasks/hooks/useTaskMutations';
import { useStatusesQuery, useDefaultStatus } from '@/features/statuses';
import type { CreateTaskFormData } from '@/features/tasks/validators/task.validators';

interface CalendarViewProps {
  projectId?: string;
  assigneeId?: string;
}

export function CalendarView({ projectId, assigneeId }: CalendarViewProps) {
  const {
    currentDate,
    view,
    selectedDate,
    setView,
    setSelectedDate,
    goToNext,
    goToPrev,
    goToToday,
  } = useCalendarStore();

  // Fetch statuses for the form
  useStatusesQuery();
  const defaultStatus = useDefaultStatus();

  // Fetch projects for the form
  const { data: projectsData } = useProjects();
  const projects = projectsData?.pages.flatMap((p) => p.data) ?? [];

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (view === 'week') {
      return {
        start: startOfWeek(currentDate),
        end: endOfWeek(currentDate),
      };
    }
    // For month view, include weeks that overlap with the month
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return {
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd),
    };
  }, [currentDate, view]);

  // Fetch tasks for the date range
  const { data: tasks = [], isLoading, isError } = useCalendarTasks(
    dateRange.start,
    dateRange.end,
    { projectId, assigneeId }
  );

  // Mutations
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();

  // Modal states
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formDefaultDate, setFormDefaultDate] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), selectedDate);
    });
  }, [tasks, selectedDate]);

  // Handlers
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };

  const handleTaskClick = (task: Task) => {
    setDetailTask(task);
    setIsDetailModalOpen(true);
  };

  const handleCreateTask = (date: Date) => {
    // Format date as YYYY-MM-DD for the form
    const dateStr = date.toISOString().split('T')[0];
    setFormDefaultDate(dateStr);
    setEditingTask(null);
    setIsFormModalOpen(true);
    setSelectedDate(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormDefaultDate('');
    setIsDetailModalOpen(false);
    setIsFormModalOpen(true);
  };

  const handleClosePanel = () => {
    setSelectedDate(null);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailTask(null);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingTask(null);
    setFormDefaultDate('');
  };

  const handleFormSubmit = (formData: CreateTaskFormData) => {
    // Parse tags from comma-separated string
    const tags = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    if (editingTask) {
      updateMutation.mutate(
        {
          taskId: editingTask._id,
          data: {
            title: formData.title,
            description: formData.description,
            statusId: formData.statusId,
            priority: formData.priority,
            tags,
            dueDate: formData.dueDate || undefined,
            assigneeId: formData.assigneeId ?? undefined,
          },
        },
        {
          onSuccess: () => {
            handleCloseFormModal();
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          title: formData.title,
          description: formData.description,
          projectId: formData.projectId,
          statusId: formData.statusId ?? defaultStatus?._id,
          priority: formData.priority,
          tags,
          dueDate: formData.dueDate || formDefaultDate || undefined,
          assigneeId: formData.assigneeId ?? undefined,
        },
        {
          onSuccess: () => {
            handleCloseFormModal();
          },
        }
      );
    }
  };

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-destructive">Failed to load calendar tasks</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
        onViewChange={setView}
      />

      {/* Calendar Grid */}
      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <CalendarGrid
          currentDate={currentDate}
          view={view}
          tasks={tasks}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onTaskClick={handleTaskClick}
        />
      </div>

      {/* Day Detail Panel */}
      <DayDetailPanel
        date={selectedDate}
        tasks={selectedDateTasks}
        isOpen={selectedDate !== null}
        onClose={handleClosePanel}
        onTaskClick={handleTaskClick}
        onCreateTask={handleCreateTask}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={detailTask}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        onEdit={handleEditTask}
      />

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        task={editingTask}
        projects={projects}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
