import { useRef, useEffect } from 'react';
import { useStatuses } from '@/features/statuses';

interface BulkStatusChangeProps {
  onSelect: (statusId: string) => void;
  onClose: () => void;
}

export function BulkStatusChange({ onSelect, onClose }: BulkStatusChangeProps) {
  const statuses = useStatuses();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-48 rounded-md border border-border bg-background py-1 shadow-lg"
    >
      {statuses.map((status) => (
        <button
          key={status._id}
          onClick={() => onSelect(status._id)}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: status.color }}
          />
          {status.name}
        </button>
      ))}
    </div>
  );
}
