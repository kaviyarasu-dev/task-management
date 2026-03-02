import { Request, Response } from 'express';
import { WebhookService } from './webhook.service';
import {
  createWebhookSchema,
  updateWebhookSchema,
  webhookQuerySchema,
  webhookIdParamSchema,
  deliveryQuerySchema,
  deliveryIdParamSchema,
} from '@api/validators/webhook.validator';

const webhookService = new WebhookService();

export const webhookController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = webhookQuerySchema.parse(req.query);
    const { isActive, event, cursor, limit } = query;
    const result = await webhookService.list(
      { isActive, event },
      { cursor, limit }
    );
    res.json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = webhookIdParamSchema.parse(req.params);
    const webhook = await webhookService.getById(id);
    res.json({ success: true, data: webhook });
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = createWebhookSchema.parse(req.body);
    const webhook = await webhookService.create(input);
    res.status(201).json({ success: true, data: webhook });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = webhookIdParamSchema.parse(req.params);
    const input = updateWebhookSchema.parse(req.body);
    const webhook = await webhookService.update(id, input);
    res.json({ success: true, data: webhook });
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = webhookIdParamSchema.parse(req.params);
    await webhookService.delete(id);
    res.json({ success: true, message: 'Webhook deleted' });
  },

  async regenerateSecret(req: Request, res: Response): Promise<void> {
    const { id } = webhookIdParamSchema.parse(req.params);
    const result = await webhookService.regenerateSecret(id);
    res.json({ success: true, data: result });
  },

  async test(req: Request, res: Response): Promise<void> {
    const { id } = webhookIdParamSchema.parse(req.params);
    const result = await webhookService.test(id);
    res.json({ success: true, data: result });
  },

  async getDeliveries(req: Request, res: Response): Promise<void> {
    const { id } = webhookIdParamSchema.parse(req.params);
    const query = deliveryQuerySchema.parse(req.query);
    const { status, cursor, limit } = query;
    const result = await webhookService.getDeliveryHistory(
      id,
      { cursor, limit },
      { status }
    );
    res.json({ success: true, ...result });
  },

  async retryDelivery(req: Request, res: Response): Promise<void> {
    const { id, deliveryId } = deliveryIdParamSchema.parse(req.params);
    await webhookService.retryDelivery(id, deliveryId);
    res.json({ success: true, message: 'Delivery queued for retry' });
  },

  async getAvailableEvents(_req: Request, res: Response): Promise<void> {
    const events = webhookService.getAvailableEvents();
    res.json({ success: true, data: events });
  },
};
