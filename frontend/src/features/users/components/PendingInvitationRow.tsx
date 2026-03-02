import { RefreshCw, X } from 'lucide-react';
import type { Invitation } from '../types/invitation.types';
import { RoleBadge } from './RoleBadge';
import { cn, formatRelativeTime } from '@/shared/lib/utils';

interface PendingInvitationRowProps {
  invitation: Invitation;
  onResend: (id: string) => void;
  onCancel: (id: string) => void;
  isResending?: boolean;
  isCancelling?: boolean;
}

export function PendingInvitationRow({
  invitation,
  onResend,
  onCancel,
  isResending,
  isCancelling,
}: PendingInvitationRowProps) {
  const isExpired = new Date(invitation.expiresAt) < new Date();

  return (
    <tr className="group border-b border-border hover:bg-muted/50">
      {/* Email & Invited Time */}
      <td className="px-4 py-3">
        <div>
          <div className="font-medium text-foreground">{invitation.email}</div>
          <div className="text-sm text-muted-foreground">
            Invited {formatRelativeTime(invitation.createdAt)}
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <RoleBadge role={invitation.role} />
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
            isExpired
              ? 'bg-destructive/10 text-destructive'
              : 'bg-yellow-500/10 text-yellow-600'
          )}
        >
          {isExpired ? 'Expired' : 'Pending'}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onResend(invitation._id)}
            disabled={isResending}
            className={cn(
              'rounded-md p-1.5 hover:bg-muted',
              isResending && 'cursor-not-allowed opacity-50'
            )}
            title="Resend invitation"
          >
            <RefreshCw className={cn('h-4 w-4', isResending && 'animate-spin')} />
          </button>
          <button
            onClick={() => onCancel(invitation._id)}
            disabled={isCancelling}
            className={cn(
              'rounded-md p-1.5 text-destructive hover:bg-destructive/10',
              isCancelling && 'cursor-not-allowed opacity-50'
            )}
            title="Cancel invitation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
