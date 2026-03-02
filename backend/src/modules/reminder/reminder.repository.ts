import { Types } from 'mongoose';
import {
  ReminderPreference,
  IReminderPreference,
} from './reminderPreference.model';
import { TaskReminder, ITaskReminder, ReminderType } from './taskReminder.model';

export class ReminderPreferenceRepository {
  async findByUser(tenantId: string, userId: string): Promise<IReminderPreference | null> {
    return ReminderPreference.findOne({
      tenantId,
      userId: new Types.ObjectId(userId),
      deletedAt: null,
    }).exec();
  }

  async upsert(
    tenantId: string,
    userId: string,
    data: Partial<IReminderPreference>
  ): Promise<IReminderPreference> {
    return ReminderPreference.findOneAndUpdate(
      { tenantId, userId: new Types.ObjectId(userId) },
      {
        $set: {
          ...data,
          tenantId,
          userId: new Types.ObjectId(userId),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    ).exec() as Promise<IReminderPreference>;
  }
}

export class TaskReminderRepository {
  async findById(tenantId: string, reminderId: string): Promise<ITaskReminder | null> {
    return TaskReminder.findOne({
      _id: reminderId,
      tenantId,
      deletedAt: null,
    }).exec();
  }

  async findByTask(tenantId: string, taskId: string): Promise<ITaskReminder[]> {
    return TaskReminder.find({
      tenantId,
      taskId: new Types.ObjectId(taskId),
      deletedAt: null,
    })
      .sort({ scheduledFor: 1 })
      .exec();
  }

  async findDue(limit = 100): Promise<ITaskReminder[]> {
    return TaskReminder.find({
      scheduledFor: { $lte: new Date() },
      sent: false,
      deletedAt: null,
    })
      .limit(limit)
      .sort({ scheduledFor: 1 })
      .exec();
  }

  async findByUserPending(
    tenantId: string,
    userId: string
  ): Promise<ITaskReminder[]> {
    return TaskReminder.find({
      tenantId,
      userId: new Types.ObjectId(userId),
      sent: false,
      deletedAt: null,
    })
      .sort({ scheduledFor: 1 })
      .exec();
  }

  async create(data: {
    tenantId: string;
    taskId: string;
    userId: string;
    scheduledFor: Date;
    type: ReminderType;
    minutesBefore: number;
    sent?: boolean;
  }): Promise<ITaskReminder> {
    const reminder = new TaskReminder({
      tenantId: data.tenantId,
      taskId: new Types.ObjectId(data.taskId),
      userId: new Types.ObjectId(data.userId),
      scheduledFor: data.scheduledFor,
      type: data.type,
      minutesBefore: data.minutesBefore,
      sent: data.sent ?? false,
    });
    return reminder.save();
  }

  async markSent(reminderId: string): Promise<ITaskReminder | null> {
    return TaskReminder.findByIdAndUpdate(
      reminderId,
      { $set: { sent: true, sentAt: new Date() } },
      { new: true }
    ).exec();
  }

  async deleteByTask(taskId: string): Promise<number> {
    const result = await TaskReminder.updateMany(
      { taskId: new Types.ObjectId(taskId), sent: false },
      { $set: { deletedAt: new Date() } }
    ).exec();
    return result.modifiedCount;
  }

  async deleteById(reminderId: string): Promise<boolean> {
    const result = await TaskReminder.findByIdAndUpdate(reminderId, {
      $set: { deletedAt: new Date() },
    }).exec();
    return result !== null;
  }
}
