import { useState, useEffect } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { useMembers } from '@/features/users';
import { UserAvatar } from '@/shared/components/UserAvatar';
import { cn } from '@/shared/lib/utils';

interface AddProjectMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (memberIds: string[]) => void;
  existingMemberIds: string[];
  isLoading?: boolean;
}

export function AddProjectMemberModal({
  isOpen,
  onClose,
  onAdd,
  existingMemberIds,
  isLoading,
}: AddProjectMemberModalProps) {
  const { data: membersData, isLoading: isMembersLoading } = useMembers();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const allMembers = membersData?.data ?? [];
  const availableMembers = allMembers.filter(
    (m) => !existingMemberIds.includes(m._id)
  );

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds([]);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const toggleMember = (memberId: string) => {
    setSelectedIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAdd = () => {
    if (selectedIds.length > 0) {
      onAdd(selectedIds);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Add Team Members
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-muted"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          {isMembersLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              All team members are already in this project
            </div>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {availableMembers.map((member) => {
                const isSelected = selectedIds.includes(member._id);
                return (
                  <button
                    key={member._id}
                    onClick={() => toggleMember(member._id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2 text-left',
                      'transition-colors hover:bg-muted',
                      isSelected && 'bg-primary/10'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        firstName={member.firstName}
                        lastName={member.lastName}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selectedIds.length === 0 || isLoading}
            className={cn(
              'flex items-center gap-2 rounded-md bg-primary px-4 py-2',
              'text-sm font-medium text-primary-foreground',
              'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Add {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
