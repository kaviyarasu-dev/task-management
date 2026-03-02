import { useState } from 'react';
import { Plus, Loader2, UserMinus } from 'lucide-react';
import { useMembers } from '@/features/users';
import { useUpdateProject } from '../hooks/useProjectMutations';
import { AddProjectMemberModal } from './AddProjectMemberModal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { UserAvatar } from '@/shared/components/UserAvatar';
import { RoleBadge } from '@/features/users/components/RoleBadge';
import type { User } from '@/shared/types/entities.types';

interface ProjectMemberListProps {
  projectId: string;
  memberIds: string[];
}

export function ProjectMemberList({ projectId, memberIds }: ProjectMemberListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);
  const { data: membersData, isLoading } = useMembers();
  const updateProject = useUpdateProject();

  const allMembers = membersData?.data ?? [];
  const projectMembers = allMembers.filter((m) => memberIds.includes(m._id));

  const handleRemoveMember = () => {
    if (!memberToRemove) return;

    const updatedMemberIds = memberIds.filter((id) => id !== memberToRemove._id);
    updateProject.mutate(
      {
        projectId,
        data: { memberIds: updatedMemberIds },
      },
      {
        onSuccess: () => setMemberToRemove(null),
      }
    );
  };

  const handleAddMembers = (newMemberIds: string[]) => {
    const uniqueMemberIds = [...new Set([...memberIds, ...newMemberIds])];
    updateProject.mutate(
      {
        projectId,
        data: { memberIds: uniqueMemberIds },
      },
      {
        onSuccess: () => setShowAddModal(false),
      }
    );
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
        <h3 className="font-medium">Members ({projectMembers.length})</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Member
        </button>
      </div>

      {projectMembers.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border">
          <p className="text-muted-foreground">No members assigned to this project</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 text-sm text-primary hover:underline"
          >
            Add team members
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="px-4 py-2">Member</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projectMembers.map((member) => (
                <tr
                  key={member._id}
                  className="group border-b border-border hover:bg-muted/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        firstName={member.firstName}
                        lastName={member.lastName}
                        size="md"
                      />
                      <div>
                        <p className="font-medium">
                          {member.firstName} {member.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setMemberToRemove(member)}
                      className="rounded p-1 text-muted-foreground opacity-0 hover:bg-muted hover:text-destructive group-hover:opacity-100"
                      title="Remove from project"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      <AddProjectMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddMembers}
        existingMemberIds={memberIds}
        isLoading={updateProject.isPending}
      />

      {/* Remove Confirmation */}
      <ConfirmDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.firstName} ${memberToRemove?.lastName} from this project?`}
        confirmText="Remove"
        isDestructive
        isLoading={updateProject.isPending}
      />
    </div>
  );
}
