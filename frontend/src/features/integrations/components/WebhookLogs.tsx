import { useState } from 'react';
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useWebhookDeliveries } from '../hooks/useWebhooks';
import { useRetryDelivery } from '../hooks/useWebhookMutations';
import type { WebhookDelivery } from '../types/webhook.types';

interface WebhookLogsProps {
  webhookId: string;
}

function DeliveryStatusBadge({ status }: { status: WebhookDelivery['status'] }) {
  const config = {
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    },
    delivered: {
      icon: CheckCircle,
      label: 'Delivered',
      className: 'bg-green-500/10 text-green-600 border-green-500/30',
    },
    failed: {
      icon: XCircle,
      label: 'Failed',
      className: 'bg-destructive/10 text-destructive border-destructive/30',
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function DeliveryRow({
  delivery,
  webhookId,
}: {
  delivery: WebhookDelivery;
  webhookId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const retryDelivery = useRetryDelivery();

  const handleRetry = async () => {
    try {
      await retryDelivery.mutateAsync({ webhookId, deliveryId: delivery._id });
    } catch {
      // Error handling is done via toast/notification
    }
  };

  const formattedDate = new Date(delivery.createdAt).toLocaleString();

  return (
    <div className="border-b border-border last:border-0">
      <div
        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button
          type="button"
          className="text-muted-foreground"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <code className="text-sm font-medium text-foreground">{delivery.event}</code>
            <DeliveryStatusBadge status={delivery.status} />
          </div>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
        </div>

        <div className="flex items-center gap-2">
          {delivery.responseStatus && (
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-xs font-mono',
                delivery.responseStatus >= 200 && delivery.responseStatus < 300
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {delivery.responseStatus}
            </span>
          )}

          {delivery.status === 'failed' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRetry();
              }}
              disabled={retryDelivery.isPending}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              {retryDelivery.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Retry
            </button>
          )}

          <span className="text-xs text-muted-foreground">
            Attempt {delivery.attemptCount}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <div className="space-y-3">
            {delivery.errorMessage && (
              <div>
                <p className="text-xs font-medium text-destructive">Error</p>
                <code className="mt-1 block rounded bg-destructive/10 p-2 text-xs text-destructive">
                  {delivery.errorMessage}
                </code>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted-foreground">Payload</p>
              <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(delivery.payload, null, 2)}
              </pre>
            </div>

            {delivery.responseBody && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Response Body</p>
                <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                  {delivery.responseBody}
                </pre>
              </div>
            )}

            {delivery.deliveredAt && (
              <p className="text-xs text-muted-foreground">
                Delivered at: {new Date(delivery.deliveredAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function WebhookLogs({ webhookId }: WebhookLogsProps) {
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'delivered' | 'failed'
  >('all');

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useWebhookDeliveries(
      webhookId,
      statusFilter === 'all' ? {} : { status: statusFilter }
    );

  const deliveries = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Delivery History</h3>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as typeof statusFilter)
          }
          className="rounded-md border border-border bg-background px-2 py-1 text-sm"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="rounded-md border border-border">
        {deliveries.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No deliveries yet</p>
          </div>
        ) : (
          <>
            {deliveries.map((delivery) => (
              <DeliveryRow
                key={delivery._id}
                delivery={delivery}
                webhookId={webhookId}
              />
            ))}

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
          </>
        )}
      </div>
    </div>
  );
}
