import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { InvitationRepository } from './invitation.repository';
import { IInvitation } from './invitation.model';
import { User, IUser } from '@modules/user/user.model';
import { Tenant } from '@modules/tenant/tenant.model';
import { EventBus } from '@core/events/EventBus';
import { RequestContext } from '@core/context/RequestContext';
import { NotFoundError, ConflictError, BadRequestError } from '@core/errors/AppError';
import { UserRole } from '../../types';

const BCRYPT_ROUNDS = 12;
const INVITATION_EXPIRY_DAYS = 7;

export interface CreateInvitationInput {
  email: string;
  role?: UserRole;
}

export interface AcceptInvitationInput {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface InvitationVerifyResult {
  isValid: boolean;
  invitation?: IInvitation;
  tenantName?: string;
  inviterName?: string;
  reason?: string;
}

export class InvitationService {
  private repo: InvitationRepository;

  constructor() {
    this.repo = new InvitationRepository();
  }

  async create(input: CreateInvitationInput): Promise<IInvitation> {
    const { tenantId, userId } = RequestContext.get();
    const email = input.email.toLowerCase();
    const role = input.role ?? 'member';

    // Check if user already exists in tenant
    const existingUser = await User.findOne({ tenantId, email }).exec();
    if (existingUser) {
      throw new ConflictError('User already exists in this organization');
    }

    // Check for pending invitation
    const existingInvitation = await this.repo.findPendingByEmail(tenantId, email);
    if (existingInvitation) {
      throw new ConflictError('Invitation already sent to this email');
    }

    const invitation = await this.repo.create({
      tenantId,
      email,
      role,
      invitedBy: userId,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    });

    await EventBus.emit('invitation.created', {
      invitationId: invitation.id as string,
      tenantId,
      email,
      role,
      invitedBy: userId,
      token: invitation.token,
    });

    return invitation;
  }

  async accept(input: AcceptInvitationInput): Promise<{ user: IUser; tenantSlug: string }> {
    const invitation = await this.repo.findByToken(input.token);

    if (!invitation) {
      throw new NotFoundError('Invitation');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestError('Invitation has already been used or cancelled');
    }

    if (new Date() > invitation.expiresAt) {
      await this.repo.updateStatus(invitation.id as string, 'expired');
      throw new BadRequestError('Invitation has expired');
    }

    // Check if user already exists (edge case: registered through another path)
    const existingUser = await User.findOne({
      tenantId: invitation.tenantId,
      email: invitation.email,
    }).exec();

    if (existingUser) {
      await this.repo.updateStatus(invitation.id as string, 'accepted');
      throw new ConflictError('User already exists in this organization');
    }

    // Create the user
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = new User({
      tenantId: invitation.tenantId,
      email: invitation.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: invitation.role,
      isEmailVerified: true, // Verified via invitation email
    });
    await user.save();

    // Mark invitation as accepted
    await this.repo.updateStatus(invitation.id as string, 'accepted');

    // Get tenant slug for redirect
    const tenant = await Tenant.findOne({ tenantId: invitation.tenantId }).exec();

    await EventBus.emit('invitation.accepted', {
      invitationId: invitation.id as string,
      tenantId: invitation.tenantId,
      userId: user.id as string,
      email: invitation.email,
    });

    return {
      user,
      tenantSlug: tenant?.slug ?? '',
    };
  }

  async verify(token: string): Promise<InvitationVerifyResult> {
    const invitation = await this.repo.findByToken(token);

    if (!invitation) {
      return { isValid: false, reason: 'Invitation not found' };
    }

    if (invitation.status !== 'pending') {
      return { isValid: false, reason: 'Invitation has already been used or cancelled' };
    }

    if (new Date() > invitation.expiresAt) {
      return { isValid: false, reason: 'Invitation has expired' };
    }

    // Get tenant and inviter details
    const tenant = await Tenant.findOne({ tenantId: invitation.tenantId }).exec();
    const inviter = await User.findById(invitation.invitedBy).exec();

    return {
      isValid: true,
      invitation,
      tenantName: tenant?.name,
      inviterName: inviter ? `${inviter.firstName} ${inviter.lastName}` : undefined,
    };
  }

  async cancel(invitationId: string): Promise<void> {
    const { tenantId } = RequestContext.get();
    const invitation = await this.repo.findById(invitationId, tenantId);

    if (!invitation) {
      throw new NotFoundError('Invitation');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestError('Cannot cancel non-pending invitation');
    }

    await this.repo.updateStatus(invitationId, 'cancelled');

    await EventBus.emit('invitation.cancelled', {
      invitationId,
      tenantId,
      email: invitation.email,
    });
  }

  async resend(invitationId: string): Promise<IInvitation> {
    const { tenantId, userId } = RequestContext.get();
    const invitation = await this.repo.findById(invitationId, tenantId);

    if (!invitation) {
      throw new NotFoundError('Invitation');
    }

    if (invitation.status !== 'pending') {
      throw new BadRequestError('Cannot resend non-pending invitation');
    }

    // Update expiry
    const newExpiresAt = new Date(Date.now() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const updated = await this.repo.updateExpiry(invitationId, newExpiresAt);

    if (!updated) {
      throw new NotFoundError('Invitation');
    }

    await EventBus.emit('invitation.created', {
      invitationId,
      tenantId,
      email: invitation.email,
      role: invitation.role,
      invitedBy: userId,
      token: invitation.token,
    });

    return updated;
  }

  async list(): Promise<IInvitation[]> {
    const { tenantId } = RequestContext.get();
    return this.repo.findAll(tenantId);
  }

  async listPending(): Promise<IInvitation[]> {
    const { tenantId } = RequestContext.get();
    return this.repo.findPending(tenantId);
  }
}
