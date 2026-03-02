import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export type ReminderType = 'due_soon' | 'overdue' | 'custom';

export interface ITaskReminder extends BaseDocument {
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  scheduledFor: Date;
  type: ReminderType;
  minutesBefore: number; // Negative for overdue (e.g., -60 = 1 hour after due)
  sent: boolean;
  sentAt?: Date;
}

const taskReminderSchema = new Schema<ITaskReminder>({
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scheduledFor: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ['due_soon', 'overdue', 'custom'],
    required: true,
  },
  minutesBefore: {
    type: Number,
    default: 0,
  },
  sent: {
    type: Boolean,
    default: false,
  },
  sentAt: {
    type: Date,
  },
});

applyBaseSchema(taskReminderSchema);

// Index for finding due reminders efficiently
taskReminderSchema.index({ tenantId: 1, scheduledFor: 1, sent: 1 });
// Index for finding all reminders for a task
taskReminderSchema.index({ taskId: 1 });
// Index for finding all reminders for a user
taskReminderSchema.index({ tenantId: 1, userId: 1, scheduledFor: 1 });

export const TaskReminder = model<ITaskReminder>('TaskReminder', taskReminderSchema);
