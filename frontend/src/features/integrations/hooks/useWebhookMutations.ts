import { useMutation, useQueryClient } from '@tanstack/react-query';
import { webhookApi } from '../services/webhookApi';
import { webhookKeys } from './useWebhooks';
import type { CreateWebhookDTO, UpdateWebhookDTO } from '../types/webhook.types';

export function useCreateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWebhookDTO) => webhookApi.createWebhook(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ webhookId, data }: { webhookId: string; data: UpdateWebhookDTO }) =>
      webhookApi.updateWebhook(webhookId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: webhookKeys.detail(variables.webhookId),
      });
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (webhookId: string) => webhookApi.deleteWebhook(webhookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

export function useToggleWebhook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ webhookId, isActive }: { webhookId: string; isActive: boolean }) =>
      webhookApi.toggleWebhook(webhookId, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: webhookKeys.detail(variables.webhookId),
      });
    },
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (webhookId: string) => webhookApi.testWebhook(webhookId),
  });
}

export function useRetryDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ webhookId, deliveryId }: { webhookId: string; deliveryId: string }) =>
      webhookApi.retryDelivery(webhookId, deliveryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: webhookKeys.deliveries(variables.webhookId),
      });
    },
  });
}
