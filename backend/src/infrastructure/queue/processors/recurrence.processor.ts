import { Job } from 'bullmq';
import { RecurrenceService } from '@modules/recurrence/recurrence.service';
import { RecurrenceJobData } from '../queues';

/**
 * Recurrence processor — processes scheduled recurrence jobs.
 * Finds all due recurrences and generates tasks for them.
 */
export async function recurrenceProcessor(job: Job<RecurrenceJobData>): Promise<void> {
  const recurrenceService = new RecurrenceService();

  console.log(`[RecurrenceProcessor] Processing recurrence check job ${job.id}`);

  try {
    // Get all recurrences that are due
    const dueRecurrences = await recurrenceService.getDueForGeneration();

    console.log(`[RecurrenceProcessor] Found ${dueRecurrences.length} due recurrences`);

    let successCount = 0;
    let errorCount = 0;

    // Process each recurrence
    for (const recurrence of dueRecurrences) {
      try {
        const newTask = await recurrenceService.generateTask(recurrence);
        console.log(
          `[RecurrenceProcessor] Generated task ${newTask._id?.toString()} from recurrence ${recurrence._id}`
        );
        successCount++;
      } catch (error) {
        console.error(
          `[RecurrenceProcessor] Failed to generate task for recurrence ${recurrence._id}:`,
          error instanceof Error ? error.message : error
        );
        errorCount++;
        // Continue processing other recurrences even if one fails
      }
    }

    console.log(
      `[RecurrenceProcessor] Completed: ${successCount} tasks generated, ${errorCount} errors`
    );
  } catch (error) {
    console.error('[RecurrenceProcessor] Error processing recurrences:', error);
    throw error; // Re-throw to mark job as failed
  }
}
