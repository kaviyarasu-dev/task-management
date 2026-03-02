import { Request, Response } from 'express';
import { CommentService } from './comment.service';
import {
  createCommentSchema,
  updateCommentSchema,
  commentIdParamSchema,
  taskIdParamSchema,
  commentQuerySchema,
} from '@api/validators/comment.validator';

const commentService = new CommentService();

export const commentController = {
  async listByTask(req: Request, res: Response): Promise<void> {
    const { taskId } = taskIdParamSchema.parse(req.params);
    const query = commentQuerySchema.parse(req.query);
    const { parentId, cursor, limit } = query;

    const result = await commentService.listByTask(
      taskId,
      { parentId: parentId === 'null' ? null : parentId },
      { cursor, limit }
    );
    res.json({ success: true, ...result });
  },

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = commentIdParamSchema.parse(req.params);
    const comment = await commentService.getById(id);
    res.json({ success: true, data: comment });
  },

  async create(req: Request, res: Response): Promise<void> {
    const { taskId } = taskIdParamSchema.parse(req.params);
    const input = createCommentSchema.parse(req.body);
    const comment = await commentService.create(taskId, input);
    res.status(201).json({ success: true, data: comment });
  },

  async update(req: Request, res: Response): Promise<void> {
    const { id } = commentIdParamSchema.parse(req.params);
    const input = updateCommentSchema.parse(req.body);
    const comment = await commentService.update(id, input);
    res.json({ success: true, data: comment });
  },

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = commentIdParamSchema.parse(req.params);
    await commentService.delete(id);
    res.json({ success: true, message: 'Comment deleted' });
  },
};
