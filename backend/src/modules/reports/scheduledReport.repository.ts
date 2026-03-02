import { Types } from 'mongoose';
import {
  ScheduledReport,
  IScheduledReport,
  ScheduledReportType,
  ReportFormat,
  IScheduledReportFilters,
  RunStatus,
} from './scheduledReport.model';

export interface CreateScheduledReportData {
  tenantId: string;
  name: string;
  reportType: ScheduledReportType;
  format: ReportFormat;
  cronExpression: string;
  timezone: string;
  recipients: string[];
  filters?: IScheduledReportFilters;
  nextRunAt: Date;
  createdBy: string;
}

export interface UpdateScheduledReportData {
  name?: string;
  cronExpression?: string;
  timezone?: string;
  recipients?: string[];
  filters?: IScheduledReportFilters;
  isActive?: boolean;
  nextRunAt?: Date;
}

export class ScheduledReportRepository {
  async findById(tenantId: string, reportId: string): Promise<IScheduledReport | null> {
    return ScheduledReport.findOne({
      _id: reportId,
      tenantId,
      deletedAt: null,
    }).exec();
  }

  async findAll(tenantId: string): Promise<IScheduledReport[]> {
    return ScheduledReport.find({
      tenantId,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByCreator(tenantId: string, userId: string): Promise<IScheduledReport[]> {
    return ScheduledReport.find({
      tenantId,
      createdBy: new Types.ObjectId(userId),
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findDue(limit = 50): Promise<IScheduledReport[]> {
    return ScheduledReport.find({
      nextRunAt: { $lte: new Date() },
      isActive: true,
      deletedAt: null,
    })
      .limit(limit)
      .sort({ nextRunAt: 1 })
      .exec();
  }

  async create(data: CreateScheduledReportData): Promise<IScheduledReport> {
    const report = new ScheduledReport({
      tenantId: data.tenantId,
      name: data.name,
      reportType: data.reportType,
      format: data.format,
      cronExpression: data.cronExpression,
      timezone: data.timezone,
      recipients: data.recipients,
      filters: data.filters,
      nextRunAt: data.nextRunAt,
      isActive: true,
      createdBy: new Types.ObjectId(data.createdBy),
    });
    return report.save();
  }

  async update(
    tenantId: string,
    reportId: string,
    data: UpdateScheduledReportData
  ): Promise<IScheduledReport | null> {
    return ScheduledReport.findOneAndUpdate(
      { _id: reportId, tenantId, deletedAt: null },
      { $set: data },
      { new: true }
    ).exec();
  }

  async updateAfterRun(
    reportId: string,
    nextRunAt: Date,
    status: RunStatus,
    error?: string
  ): Promise<IScheduledReport | null> {
    return ScheduledReport.findByIdAndUpdate(
      reportId,
      {
        $set: {
          nextRunAt,
          lastRunAt: new Date(),
          lastRunStatus: status,
          lastError: status === 'failed' ? error : null,
        },
      },
      { new: true }
    ).exec();
  }

  async softDelete(tenantId: string, reportId: string): Promise<boolean> {
    const result = await ScheduledReport.findOneAndUpdate(
      { _id: reportId, tenantId, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    ).exec();
    return result !== null;
  }

  async setActive(tenantId: string, reportId: string, isActive: boolean): Promise<boolean> {
    const result = await ScheduledReport.findOneAndUpdate(
      { _id: reportId, tenantId, deletedAt: null },
      { $set: { isActive } }
    ).exec();
    return result !== null;
  }
}
