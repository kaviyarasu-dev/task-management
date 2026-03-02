import 'dotenv/config';
import { createApp } from './app';
import { config } from './config';
import { connectMongoDB, disconnectMongoDB } from '@infrastructure/database/mongodb/client';
import { getRedisClient, disconnectRedis } from '@infrastructure/redis/client';
import { initSocketServer } from '@infrastructure/websocket/socket.server';
import { registerNotificationListeners } from './modules/notification/notification.listener';
import { registerUserListeners } from './modules/user/listeners/user.listener';
import { registerTenantListeners } from './modules/tenant/listeners/tenant.listener';
import { registerActivityListeners } from './modules/activity/activity.listener';
import { registerWebhookListeners } from './modules/webhook/webhook.listener';
import { createEmailWorker } from '@infrastructure/queue/workers/email.worker';
import { createReminderWorker } from '@infrastructure/queue/workers/reminder.worker';
import { createRecurrenceWorker } from '@infrastructure/queue/workers/recurrence.worker';
import { createDigestWorker } from '@infrastructure/queue/workers/digest.worker';
import { createScheduledReportWorker } from '@infrastructure/queue/workers/scheduledReport.worker';
import { createWebhookWorker } from '@infrastructure/queue/workers/webhook.worker';
import { emailProcessor } from '@infrastructure/queue/processors/email.processor';
import { reminderProcessor } from '@infrastructure/queue/processors/reminder.processor';
import { recurrenceProcessor } from '@infrastructure/queue/processors/recurrence.processor';
import { digestProcessor } from '@infrastructure/queue/processors/digest.processor';
import { scheduledReportProcessor } from '@infrastructure/queue/processors/scheduledReport.processor';
import { webhookProcessor } from '@infrastructure/queue/processors/webhook.processor';
import { recurrenceQueue, reminderQueue, digestQueue, scheduledReportQueue } from '@infrastructure/queue/queues';
import http from 'http';

async function start(): Promise<void> {
  // 1. Connect infrastructure
  await connectMongoDB();
  getRedisClient();

  // 2. Register all domain event listeners before routes can fire events
  registerNotificationListeners();
  registerUserListeners();
  registerTenantListeners();
  registerActivityListeners();
  registerWebhookListeners();

  // 3. Start background workers with injected processors (infra stays dumb)
  createEmailWorker(emailProcessor);
  createReminderWorker(reminderProcessor);
  createRecurrenceWorker(recurrenceProcessor);
  createDigestWorker(digestProcessor);
  createScheduledReportWorker(scheduledReportProcessor);
  createWebhookWorker(webhookProcessor);

  // 4. Schedule recurring jobs
  await recurrenceQueue.add(
    'check-recurrences',
    { triggeredAt: new Date().toISOString() },
    {
      repeat: { every: 5 * 60 * 1000 }, // Check every 5 minutes
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );

  // Check reminders every minute
  await reminderQueue.add(
    'check-reminders',
    { triggeredAt: new Date().toISOString() },
    {
      repeat: { every: 60 * 1000 }, // Every minute
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );

  // Check digests every hour (users filter by their timezone)
  await digestQueue.add(
    'send-digests',
    { triggeredAt: new Date().toISOString() },
    {
      repeat: { every: 60 * 60 * 1000 }, // Every hour
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );

  // Check scheduled reports every 5 minutes
  await scheduledReportQueue.add(
    'check-scheduled-reports',
    { triggeredAt: new Date().toISOString() },
    {
      repeat: { every: 5 * 60 * 1000 }, // Every 5 minutes
      removeOnComplete: true,
      removeOnFail: 100,
    }
  );

  // 5. Create Express app
  const app = await createApp();
  const server = http.createServer(app);

  // 6. Initialize WebSocket — bridges EventBus to connected clients
  initSocketServer(server);

  // 7. Start listening
  server.listen(config.PORT, () => {
    console.log(`🚀 Server running on port ${config.PORT} [${config.NODE_ENV}]`);
    console.log(`   Health: http://localhost:${config.PORT}/health`);
  });

  // 8. Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      console.log('HTTP server closed');
      try {
        await disconnectMongoDB();
        await disconnectRedis();
        console.log('✅ Graceful shutdown complete');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });

    // Force exit after 10s if graceful shutdown hangs
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
    if (config.NODE_ENV === 'production') process.exit(1);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
