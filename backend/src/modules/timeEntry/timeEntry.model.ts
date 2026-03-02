import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export interface ITimeEntry extends BaseDocument {
  taskId: Types.ObjectId;
  userId: Types.ObjectId;
  description?: string;
  startedAt: Date;
  endedAt?: Date;
  durationMinutes?: number;
  billable: boolean;
}

const timeEntrySchema = new Schema<ITimeEntry>({
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
  description: {
    type: String,
    maxlength: 500,
    trim: true,
  },
  startedAt: {
    type: Date,
    required: true,
  },
  endedAt: {
    type: Date,
    default: null,
  },
  durationMinutes: {
    type: Number,
    min: 0,
    default: null,
  },
  billable: {
    type: Boolean,
    default: false,
  },
});

applyBaseSchema(timeEntrySchema);

// Indexes for common query patterns
timeEntrySchema.index({ tenantId: 1, taskId: 1 });
timeEntrySchema.index({ tenantId: 1, userId: 1, startedAt: -1 });
timeEntrySchema.index({ tenantId: 1, userId: 1, endedAt: 1 }); // For finding active timers (endedAt: null)

export const TimeEntry = model<ITimeEntry>('TimeEntry', timeEntrySchema);
