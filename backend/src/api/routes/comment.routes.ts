import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { commentController } from '@modules/comment/comment.controller';

const router = Router();

router.use(authMiddleware); // All comment routes require auth

// Task comments (nested under tasks)
router.get('/tasks/:taskId/comments', asyncWrapper(commentController.listByTask));
router.post('/tasks/:taskId/comments', asyncWrapper(commentController.create));

// Individual comment operations
router.get('/comments/:id', asyncWrapper(commentController.getById));
router.patch('/comments/:id', asyncWrapper(commentController.update));
router.delete('/comments/:id', asyncWrapper(commentController.delete));

export { router as commentRouter };
