import { api } from '@/shared/lib/axios';
import type { ApiResponse, PaginatedResponse } from '@/shared/types/api.types';
import type {
  Webhook,
  WebhookDelivery,
  CreateWebhookDTO,
  UpdateWebhookDTO,
} from '../types/webhook.types';

export interface WebhookFilters {
  isActive?: boolean;
  cursor?: string;
  limit?: number;
}

export interface DeliveryFilters {
  status?: 'pending' | 'delivered' | 'failed';
  cursor?: string;
  limit?: number;
}

export const webhookApi = {
  // Get all webhooks
  getWebhooks: async (filters: WebhookFilters = {}): Promise<PaginatedResponse<Webhook>> => {
    const params = new URLSearchParams();
    if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters.cursor) params.append('cursor', filters.cursor);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<Webhook>>(`/webhooks?${params.toString()}`);
    return response.data;
  },

  // Get single webhook
  getWebhook: async (webhookId: string): Promise<ApiResponse<Webhook>> => {
    const response = await api.get<ApiResponse<Webhook>>(`/webhooks/${webhookId}`);
    return response.data;
  },

  // Create webhook
  createWebhook: async (data: CreateWebhookDTO): Promise<ApiResponse<Webhook>> => {
    const response = await api.post<ApiResponse<Webhook>>('/webhooks', data);
    return response.data;
  },

  // Update webhook
  updateWebhook: async (
    webhookId: string,
    data: UpdateWebhookDTO
  ): Promise<ApiResponse<Webhook>> => {
    const response = await api.patch<ApiResponse<Webhook>>(`/webhooks/${webhookId}`, data);
    return response.data;
  },

  // Delete webhook
  deleteWebhook: async (webhookId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/webhooks/${webhookId}`);
    return response.data;
  },

  // Toggle webhook active status
  toggleWebhook: async (
    webhookId: string,
    isActive: boolean
  ): Promise<ApiResponse<Webhook>> => {
    const response = await api.patch<ApiResponse<Webhook>>(`/webhooks/${webhookId}`, {
      isActive,
    });
    return response.data;
  },

  // Test webhook
  testWebhook: async (
    webhookId: string
  ): Promise<ApiResponse<{ success: boolean; statusCode?: number; error?: string }>> => {
    const response = await api.post<
      ApiResponse<{ success: boolean; statusCode?: number; error?: string }>
    >(`/webhooks/${webhookId}/test`);
    return response.data;
  },

  // Get webhook deliveries
  getDeliveries: async (
    webhookId: string,
    filters: DeliveryFilters = {}
  ): Promise<PaginatedResponse<WebhookDelivery>> => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.cursor) params.append('cursor', filters.cursor);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get<PaginatedResponse<WebhookDelivery>>(
      `/webhooks/${webhookId}/deliveries?${params.toString()}`
    );
    return response.data;
  },

  // Retry failed delivery
  retryDelivery: async (
    webhookId: string,
    deliveryId: string
  ): Promise<ApiResponse<WebhookDelivery>> => {
    const response = await api.post<ApiResponse<WebhookDelivery>>(
      `/webhooks/${webhookId}/deliveries/${deliveryId}/retry`
    );
    return response.data;
  },
};
