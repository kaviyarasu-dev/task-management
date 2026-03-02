import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurrencePattern {
  type: RecurrenceType;
  interval: number; // Every N days/weeks/months
  daysOfWeek?: number[]; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  cronExpression?: string; // For custom patterns
}

export interface IRecurrence extends BaseDocument {
  taskTemplateId: Types.ObjectId;
  pattern: RecurrencePattern;
  nextOccurrence: Date;
  endDate?: Date;
  endAfterCount?: number;
  occurrenceCount: number;
  isActive: boolean;
  createdBy: string;
}

const recurrencePatternSchema = new Schema<RecurrencePattern>(
  {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      required: true,
    },
    interval: {
      type: Number,
      required: true,
      min: 1,
      max: 365,
    },
    daysOfWeek: {
      type: [{ type: Number, min: 0, max: 6 }],
      default: undefined,
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31,
    },
    cronExpression: {
      type: String,
    },
  },
  { _id: false }
);

const recurrenceSchema = new Schema<IRecurrence>({
  taskTemplateId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    index: true,
  },
  pattern: {
    type: recurrencePatternSchema,
    required: true,
  },
  nextOccurrence: {
    type: Date,
    required: true,
    index: true,
  },
  endDate: {
    type: Date,
  },
  endAfterCount: {
    type: Number,
    min: 1,
  },
  occurrenceCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
});

applyBaseSchema(recurrenceSchema);

// Compound index for finding due recurrences efficiently
recurrenceSchema.index({ tenantId: 1, isActive: 1, nextOccurrence: 1 });

// Index for finding recurrences by task template
recurrenceSchema.index({ tenantId: 1, taskTemplateId: 1 });

export const Recurrence = model<IRecurrence>('Recurrence', recurrenceSchema);
