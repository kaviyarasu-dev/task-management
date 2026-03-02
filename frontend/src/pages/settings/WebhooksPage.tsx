import { useState } from 'react';
import { Plus, ArrowLeft, Webhook as WebhookIcon } from 'lucide-react';
import {
  WebhookList,
  WebhookFormModal,
  WebhookLogs,
  useCreateWebhook,
  useUpdateWebhook,
  type Webhook,
  type CreateWebhookFormData,
} from '@/features/integrations';

type ViewState =
  | { type: 'list' }
  | { type: 'logs'; webhook: Webhook };

export function WebhooksPage() {
  const [viewState, setViewState] = useState<ViewState>({ type: 'list' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);

  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();

  const handleOpenCreate = () => {
    setSelectedWebhook(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (webhook: Webhook) => {
    setSelectedWebhook(webhook);
    setIsModalOpen(true);
  };

  const handleViewLogs = (webhook: Webhook) => {
    setViewState({ type: 'logs', webhook });
  };

  const handleBackToList = () => {
    setViewState({ type: 'list' });
  };

  const handleSubmit = async (data: CreateWebhookFormData) => {
    try {
      if (selectedWebhook) {
        await updateWebhook.mutateAsync({
          webhookId: selectedWebhook._id,
          data,
        });
      } else {
        await createWebhook.mutateAsync(data);
      }
      setIsModalOpen(false);
      setSelectedWebhook(null);
    } catch {
      // Error handling via toast
    }
  };

  const isLoading = createWebhook.isPending || updateWebhook.isPending;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {viewState.type === 'logs' && (
            <button
              onClick={handleBackToList}
              className="rounded p-1 hover:bg-muted"
              aria-label="Back to webhooks"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {viewState.type === 'logs' ? viewState.webhook.name : 'Webhooks'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {viewState.type === 'logs'
                ? 'View delivery history and retry failed deliveries'
                : 'Configure outgoing webhooks to receive real-time event notifications'}
            </p>
          </div>
        </div>

        {viewState.type === 'list' && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create Webhook
          </button>
        )}

        {viewState.type === 'logs' && (
          <button
            onClick={() => handleOpenEdit(viewState.webhook)}
            className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <WebhookIcon className="h-4 w-4" />
            Edit Webhook
          </button>
        )}
      </div>

      {/* Content */}
      <div className="rounded-lg border border-border bg-background">
        {viewState.type === 'list' ? (
          <WebhookList onEdit={handleOpenEdit} onViewLogs={handleViewLogs} />
        ) : (
          <div className="p-4">
            <WebhookLogs webhookId={viewState.webhook._id} />
          </div>
        )}
      </div>

      {/* Form Modal */}
      <WebhookFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedWebhook(null);
        }}
        onSubmit={handleSubmit}
        webhook={selectedWebhook}
        isLoading={isLoading}
      />
    </div>
  );
}
