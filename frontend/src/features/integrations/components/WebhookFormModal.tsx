import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Link, Key, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { createWebhookSchema, type CreateWebhookFormData } from '../validators/webhook.validators';
import { WebhookEventSelect } from './WebhookEventSelect';
import type { Webhook } from '../types/webhook.types';

interface WebhookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWebhookFormData) => void;
  webhook: Webhook | null;
  isLoading?: boolean;
}

export function WebhookFormModal({
  isOpen,
  onClose,
  onSubmit,
  webhook,
  isLoading = false,
}: WebhookFormModalProps) {
  const [showSecret, setShowSecret] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateWebhookFormData>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: {
      name: '',
      url: '',
      events: [],
      secret: '',
      isActive: true,
    },
  });

  // Reset form when modal opens/closes or webhook changes
  useEffect(() => {
    if (isOpen) {
      if (webhook) {
        reset({
          name: webhook.name,
          url: webhook.url,
          events: webhook.events,
          secret: webhook.secret ?? '',
          isActive: webhook.isActive,
        });
      } else {
        reset({
          name: '',
          url: '',
          events: [],
          secret: '',
          isActive: true,
        });
      }
      setShowSecret(false);
    }
  }, [isOpen, webhook, reset]);

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
      <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {webhook ? 'Edit Webhook' : 'Create Webhook'}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-muted"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Name *
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={cn(
                'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                errors.name && 'border-destructive'
              )}
              placeholder="My Webhook"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-foreground">
              <span className="flex items-center gap-1.5">
                <Link className="h-4 w-4" />
                Endpoint URL *
              </span>
            </label>
            <input
              id="url"
              type="url"
              {...register('url')}
              className={cn(
                'mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono',
                'focus:outline-none focus:ring-2 focus:ring-primary/50',
                errors.url && 'border-destructive'
              )}
              placeholder="https://your-server.com/webhooks"
            />
            {errors.url && (
              <p className="mt-1 text-sm text-destructive">{errors.url.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Must be a valid HTTPS URL that can receive POST requests
            </p>
          </div>

          {/* Events */}
          <Controller
            name="events"
            control={control}
            render={({ field }) => (
              <WebhookEventSelect
                value={field.value}
                onChange={field.onChange}
                error={errors.events?.message}
              />
            )}
          />

          {/* Secret */}
          <div>
            <label htmlFor="secret" className="block text-sm font-medium text-foreground">
              <span className="flex items-center gap-1.5">
                <Key className="h-4 w-4" />
                Signing Secret
              </span>
            </label>
            <div className="relative mt-1">
              <input
                id="secret"
                type={showSecret ? 'text' : 'password'}
                {...register('secret')}
                className={cn(
                  'w-full rounded-md border border-border bg-background px-3 py-2 pr-10 text-sm font-mono',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50',
                  errors.secret && 'border-destructive'
                )}
                placeholder="Optional signing secret"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label={showSecret ? 'Hide secret' : 'Show secret'}
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.secret && (
              <p className="mt-1 text-sm text-destructive">{errors.secret.message}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Used to sign webhook payloads. Include in the X-Webhook-Signature header.
            </p>
          </div>

          {/* Active status */}
          <div className="flex items-center gap-3">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-5 w-9 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-background after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-4" />
                </label>
              )}
            />
            <span className="text-sm text-foreground">
              {webhook ? 'Webhook is active' : 'Enable webhook immediately'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {webhook ? 'Update Webhook' : 'Create Webhook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
