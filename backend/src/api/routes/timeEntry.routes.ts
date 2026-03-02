import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { asyncWrapper } from '@core/utils/asyncWrapper';
import { timeEntryController } from '@modules/timeEntry/timeEntry.controller';

const router = Router();

router.use(authMiddleware); // All time entry routes require auth

// Timer endpoints
router.post('/start', asyncWrapper(timeEntryController.startTimer));
router.post('/stop/:id', asyncWrapper(timeEntryController.stopTimer));
router.get('/active', asyncWrapper(timeEntryController.getActiveTimer));

// Reports
router.get('/report/weekly', asyncWrapper(timeEntryController.getWeeklyReport));
router.get('/report/task/:taskId', asyncWrapper(timeEntryController.getTaskTotal));

// CRUD endpoints
router.get('/', asyncWrapper(timeEntryController.list));
router.get('/task/:taskId', asyncWrapper(timeEntryController.listByTask));
router.get('/:id', asyncWrapper(timeEntryController.getById));
router.post('/', asyncWrapper(timeEntryController.createManual));
router.patch('/:id', asyncWrapper(timeEntryController.update));
router.delete('/:id', asyncWrapper(timeEntryController.delete));

export { router as timeEntryRouter };
