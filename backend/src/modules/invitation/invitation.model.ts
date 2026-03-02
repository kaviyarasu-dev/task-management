import { Schema, model, Types } from 'mongoose';
import { applyBaseSchema, BaseDocument } from '@infrastructure/database/mongodb/baseModel';
import { UserRole } from '../../types';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface IInvitation extends BaseDocument {
  email: string;
  role: UserRole;
  invitedBy: Types.ObjectId;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  status: InvitationStatus;
}

const invitationSchema = new Schema<IInvitation>({
  email: { type: String, required: true, lowercase: true, trim: true },
  role: {
    type: String,
    enum: ['admin', 'member', 'viewer'],
    default: 'member',
  },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending',
  },
});

applyBaseSchema(invitationSchema);

// Find invitations by tenant and email
invitationSchema.index({ tenantId: 1, email: 1 });
// Token lookup for accepting invitations
invitationSchema.index({ token: 1 });
// For cleanup jobs to find expired invitations
invitationSchema.index({ expiresAt: 1, status: 1 });

export const Invitation = model<IInvitation>('Invitation', invitationSchema);
