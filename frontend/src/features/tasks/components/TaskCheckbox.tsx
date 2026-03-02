import { useSelectionStore, useIsSelected } from '../stores/selectionStore';
import { cn } from '@/shared/lib/utils';

interface TaskCheckboxProps {
  taskId: string;
  className?: string;
}

export function TaskCheckbox({ taskId, className }: TaskCheckboxProps) {
  const isSelected = useIsSelected(taskId);
  const toggleOne = useSelectionStore((state) => state.toggleOne);

  return (
    <input
      type="checkbox"
      checked={isSelected}
      onChange={() => toggleOne(taskId)}
      className={cn(
        'h-4 w-4 rounded border-border text-primary focus:ring-primary/50',
        className
      )}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
