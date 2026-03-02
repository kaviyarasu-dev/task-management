export interface Webhook {
  _id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  isActive: boolean;
  lastDeliveryAt?: string;
  lastDeliveryStatus?: 'success' | 'failed';
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  _id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  responseStatus?: number;
  responseBody?: string;
  status: 'pending' | 'delivered' | 'failed';
  attemptCount: number;
  errorMessage?: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface CreateWebhookDTO {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  isActive?: boolean;
}

export interface UpdateWebhookDTO {
  name?: string;
  url?: string;
  events?: string[];
  secret?: string;
  headers?: Record<string, string>;
  isActive?: boolean;
}

export interface WebhookEvent {
  value: string;
  label: string;
  category: string;
}

export const WEBHOOK_EVENT_CATEGORIES = {
  task: 'Tasks',
  project: 'Projects',
  comment: 'Comments',
  user: 'Users',
} as const;

export const WEBHOOK_EVENTS: WebhookEvent[] = [
  { value: 'task.created', label: 'Task Created', category: 'task' },
  { value: 'task.updated', label: 'Task Updated', category: 'task' },
  { value: 'task.deleted', label: 'Task Deleted', category: 'task' },
  { value: 'task.status.changed', label: 'Task Status Changed', category: 'task' },
  { value: 'task.assigned', label: 'Task Assigned', category: 'task' },
  { value: 'project.created', label: 'Project Created', category: 'project' },
  { value: 'project.updated', label: 'Project Updated', category: 'project' },
  { value: 'project.deleted', label: 'Project Deleted', category: 'project' },
  { value: 'comment.created', label: 'Comment Created', category: 'comment' },
  { value: 'comment.deleted', label: 'Comment Deleted', category: 'comment' },
  { value: 'user.joined', label: 'User Joined', category: 'user' },
  { value: 'user.left', label: 'User Left', category: 'user' },
];

export type WebhookEventValue = (typeof WEBHOOK_EVENTS)[number]['value'];
