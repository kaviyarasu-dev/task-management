import { Job } from 'bullmq';
import { ScheduledReportService } from '@modules/reports/scheduledReport.service';

/**
 * Scheduled report processor — processes due scheduled reports.
 * Runs on a schedule and finds all reports that are due to be generated and sent.
 */
export async function scheduledReportProcessor(job: Job): Promise<void> {
  console.log(`[ScheduledReportProcessor] Starting scheduled report check (job ${job.id})`);

  const scheduledReportService = new ScheduledReportService();
  const dueReports = await scheduledReportService.getDueReports();

  console.log(`[ScheduledReportProcessor] Found ${dueReports.length} due reports`);

  let successCount = 0;
  let errorCount = 0;

  for (const report of dueReports) {
    try {
      await scheduledReportService.processScheduledReport(report);
      successCount++;
      console.log(`[ScheduledReportProcessor] Processed report "${report.name}" (${report._id})`);
    } catch (error) {
      errorCount++;
      console.error(
        `[ScheduledReportProcessor] Failed to process report "${report.name}" (${report._id}):`,
        error instanceof Error ? error.message : error
      );
    }
  }

  console.log(
    `[ScheduledReportProcessor] Completed: ${successCount} success, ${errorCount} failed`
  );
}
