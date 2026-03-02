import { Types } from 'mongoose';
import { Invitation, IInvitation, InvitationStatus } from './invitation.model';
import { UserRole } from '../../types';

export interface CreateInvitationData {
  tenantId: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  token: string;
  expiresAt: Date;
}

export class InvitationRepository {
  async create(data: CreateInvitationData): Promise<IInvitation> {
    const invitation = new Invitation({
      ...data,
      invitedBy: new Types.ObjectId(data.invitedBy),
    });
    return invitation.save();
  }

  async findById(id: string, tenantId: string): Promise<IInvitation | null> {
    return Invitation.findOne({ _id: id, tenantId }).exec();
  }

  async findByToken(token: string): Promise<IInvitation | null> {
    return Invitation.findOne({ token }).exec();
  }

  async findPendingByEmail(tenantId: string, email: string): Promise<IInvitation | null> {
    return Invitation.findOne({
      tenantId,
      email,
      status: 'pending',
    }).exec();
  }

  async findPending(tenantId: string): Promise<IInvitation[]> {
    return Invitation.find({ tenantId, status: 'pending' })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(tenantId: string): Promise<IInvitation[]> {
    return Invitation.find({ tenantId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateStatus(id: string, status: InvitationStatus): Promise<IInvitation | null> {
    const updateData: Partial<IInvitation> = { status };
    if (status === 'accepted') {
      updateData.acceptedAt = new Date();
    }
    return Invitation.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async updateExpiry(id: string, expiresAt: Date): Promise<IInvitation | null> {
    return Invitation.findByIdAndUpdate(
      id,
      { expiresAt },
      { new: true }
    ).exec();
  }

  async expirePastDue(): Promise<number> {
    const result = await Invitation.updateMany(
      { status: 'pending', expiresAt: { $lt: new Date() } },
      { status: 'expired' }
    ).exec();
    return result.modifiedCount;
  }

  async checkEmailExists(tenantId: string, email: string): Promise<boolean> {
    const count = await Invitation.countDocuments({
      tenantId,
      email,
      status: { $in: ['pending', 'accepted'] },
    }).exec();
    return count > 0;
  }
}
