import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { webhookApi, type WebhookFilters, type DeliveryFilters } from '../services/webhookApi';

export const webhookKeys = {
  all: ['webhooks'] as const,
  lists: () => [...webhookKeys.all, 'list'] as const,
  list: (filters: WebhookFilters) => [...webhookKeys.lists(), filters] as const,
  details: () => [...webhookKeys.all, 'detail'] as const,
  detail: (id: string) => [...webhookKeys.details(), id] as const,
  deliveries: (webhookId: string) => [...webhookKeys.all, 'deliveries', webhookId] as const,
  deliveriesList: (webhookId: string, filters: DeliveryFilters) =>
    [...webhookKeys.deliveries(webhookId), filters] as const,
};

export function useWebhooks(filters: Omit<WebhookFilters, 'cursor'> = {}) {
  return useInfiniteQuery({
    queryKey: webhookKeys.list(filters),
    queryFn: ({ pageParam }) =>
      webhookApi.getWebhooks({ ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useWebhook(webhookId: string | undefined) {
  return useQuery({
    queryKey: webhookKeys.detail(webhookId!),
    queryFn: () => webhookApi.getWebhook(webhookId!),
    enabled: !!webhookId,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useWebhookDeliveries(
  webhookId: string | undefined,
  filters: Omit<DeliveryFilters, 'cursor'> = {}
) {
  return useInfiniteQuery({
    queryKey: webhookKeys.deliveriesList(webhookId!, filters),
    queryFn: ({ pageParam }) =>
      webhookApi.getDeliveries(webhookId!, { ...filters, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!webhookId,
    staleTime: 1000 * 30, // 30 seconds for deliveries
  });
}
