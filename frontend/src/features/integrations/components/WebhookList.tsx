import { useState } from 'react';
import {
  Webhook as WebhookIcon,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useWebhooks } from '../hooks/useWebhooks';
import { useToggleWebhook, useDeleteWebhook } from '../hooks/useWebhookMutations';
import { WebhookTestButton } from './WebhookTestButton';
import { WEBHOOK_EVENTS, type Webhook } from '../types/webhook.types';

interface WebhookListProps {
  onEdit: (webhook: Webhook) => void;
  onViewLogs: (webhook: Webhook) => void;
}

function WebhookStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        isActive
          ? 'bg-green-500/10 text-green-600'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isActive ? 'bg-green-500' : 'bg-muted-foreground'
        )}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function LastDeliveryStatus({
  status,
  timestamp,
}: {
  status?: 'success' | 'failed';
  timestamp?: string;
}) {
  if (!status || !timestamp) {
    return <span className="text-xs text-muted-foreground">Never</span>;
  }

  const formattedTime = new Date(timestamp).toLocaleString();

  return (
    <div className="flex items-center gap-1.5">
      {status === 'success' ? (
        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-destructive" />
      )}
      <span className="text-xs text-muted-foreground">{formattedTime}</span>
    </div>
  );
}

function WebhookRow({
  webhook,
  onEdit,
  onViewLogs,
}: {
  webhook: Webhook;
  onEdit: (webhook: Webhook) => void;
  onViewLogs: (webhook: Webhook) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toggleWebhook = useToggleWebhook();
  const deleteWebhook = useDeleteWebhook();

  const handleToggle = async () => {
    try {
      await toggleWebhook.mutateAsync({
        webhookId: webhook._id,
        isActive: !webhook.isActive,
      });
    } catch {
      // Error handling via toast
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    setIsDeleting(true);
    try {
      await deleteWebhook.mutateAsync(webhook._id);
    } catch {
      // Error handling via toast
    } finally {
      setIsDeleting(false);
      setIsMenuOpen(false);
    }
  };

  // Get event labels for display
  const eventLabels = webhook.events
    .map((e) => WEBHOOK_EVENTS.find((we) => we.value === e)?.label ?? e)
    .slice(0, 3);
  const remainingCount = webhook.events.length - 3;

  return (
    <tr className="border-b border-border hover:bg-muted/50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <WebhookIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{webhook.name}</p>
            <p className="max-w-xs truncate text-xs text-muted-foreground font-mono">
              {webhook.url}
            </p>
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {eventLabels.map((label) => (
            <span
              key={label}
              className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {label}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              +{remainingCount} more
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <WebhookStatusBadge isActive={webhook.isActive} />
      </td>

      <td className="px-4 py-3">
        <LastDeliveryStatus
          status={webhook.lastDeliveryStatus}
          timestamp={webhook.lastDeliveryAt}
        />
        {webhook.failureCount > 0 && (
          <p className="text-xs text-destructive">
            {webhook.failureCount} failure{webhook.failureCount !== 1 ? 's' : ''}
          </p>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <WebhookTestButton
            webhookId={webhook._id}
            isDisabled={!webhook.isActive}
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded p-1.5 hover:bg-muted"
              aria-label="More options"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-border bg-background py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(webhook);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onViewLogs(webhook);
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Eye className="h-4 w-4" />
                    View Logs
                  </button>
                  <button
                    type="button"
                    onClick={handleToggle}
                    disabled={toggleWebhook.isPending}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                  >
                    {toggleWebhook.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : webhook.isActive ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {webhook.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <hr className="my-1 border-border" />
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export function WebhookList({ onEdit, onViewLogs }: WebhookListProps) {
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useWebhooks();

  const webhooks = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (webhooks.length === 0) {
    return (
      <div className="py-12 text-center">
        <WebhookIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-medium text-foreground">No webhooks configured</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a webhook to receive real-time notifications about events in your workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Webhook
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Events
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Last Delivery
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {webhooks.map((webhook) => (
            <WebhookRow
              key={webhook._id}
              webhook={webhook}
              onEdit={onEdit}
              onViewLogs={onViewLogs}
            />
          ))}
        </tbody>
      </table>

      {hasNextPage && (
        <div className="p-4 text-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
