import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';

export interface IReminderPreference extends BaseDocument {
  userId: Types.ObjectId;
  defaultReminders: number[]; // Minutes before due: [60, 1440] = 1hr, 1day
  overdueReminders: boolean;
  dailyDigest: boolean;
  digestTime: string; // "09:00" in user's timezone
  timezone: string;
}

const reminderPreferenceSchema = new Schema<IReminderPreference>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  defaultReminders: {
    type: [Number],
    default: [60, 1440], // 1 hour, 1 day before
  },
  overdueReminders: {
    type: Boolean,
    default: true,
  },
  dailyDigest: {
    type: Boolean,
    default: false,
  },
  digestTime: {
    type: String,
    default: '09:00',
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
});

applyBaseSchema(reminderPreferenceSchema);

// Unique constraint per tenant/user
reminderPreferenceSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export const ReminderPreference = model<IReminderPreference>(
  'ReminderPreference',
  reminderPreferenceSchema
);
