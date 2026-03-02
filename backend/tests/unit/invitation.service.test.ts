import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { InvitationService } from '../../src/modules/invitation/invitation.service';
import { InvitationRepository } from '../../src/modules/invitation/invitation.repository';
import { User } from '../../src/modules/user/user.model';
import { Tenant } from '../../src/modules/tenant/tenant.model';
import { EventBus } from '../../src/core/events/EventBus';
import { RequestContext } from '../../src/core/context/RequestContext';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from '../../src/core/errors/AppError';
import { createInvitation, createUser, createTenant } from '../helpers/factories';

// Mock dependencies
jest.mock('../../src/modules/invitation/invitation.repository');
jest.mock('../../src/modules/user/user.model');
jest.mock('../../src/modules/tenant/tenant.model');
jest.mock('../../src/core/events/EventBus', () => ({
  EventBus: { emit: jest.fn().mockResolvedValue(undefined) },
}));

const mockContext = {
  userId: 'user-1',
  tenantId: 'tenant-1',
  email: 'admin@example.com',
  role: 'admin' as const,
  requestId: 'req-1',
};

describe('InvitationService', () => {
  let invitationService: InvitationService;
  let mockRepo: jest.Mocked<InvitationRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    invitationService = new InvitationService();
    mockRepo = (InvitationRepository as jest.MockedClass<typeof InvitationRepository>)
      .mock.instances[0] as jest.Mocked<InvitationRepository>;
  });

  describe('create', () => {
    it('should create invitation and emit event', async () => {
      const input = { email: 'newuser@example.com', role: 'member' as const };
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId, {
          email: input.email,
          role: input.role,
        }),
        id: 'invitation-1',
      };

      (User.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockRepo.findPendingByEmail = jest.fn().mockResolvedValue(null);
      mockRepo.create = jest.fn().mockResolvedValue(mockInvitation);

      await RequestContext.run(mockContext, async () => {
        const result = await invitationService.create(input);

        expect(result).toEqual(mockInvitation);
        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId: mockContext.tenantId,
            email: input.email.toLowerCase(),
            role: input.role,
            invitedBy: mockContext.userId,
          })
        );
        expect(EventBus.emit).toHaveBeenCalledWith(
          'invitation.created',
          expect.objectContaining({
            email: input.email.toLowerCase(),
            role: input.role,
          })
        );
      });
    });

    it('should reject if user already exists in tenant', async () => {
      const input = { email: 'existing@example.com' };
      const existingUser = createUser(mockContext.tenantId, { email: input.email });

      (User.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingUser),
      });

      await RequestContext.run(mockContext, async () => {
        await expect(invitationService.create(input)).rejects.toThrow(ConflictError);
        await expect(invitationService.create(input)).rejects.toThrow(
          'User already exists in this organization'
        );
      });
    });

    it('should reject if pending invitation already exists', async () => {
      const input = { email: 'pending@example.com' };
      const existingInvitation = createInvitation(mockContext.tenantId, mockContext.userId, {
        email: input.email,
        status: 'pending',
      });

      (User.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockRepo.findPendingByEmail = jest.fn().mockResolvedValue(existingInvitation);

      await RequestContext.run(mockContext, async () => {
        await expect(invitationService.create(input)).rejects.toThrow(ConflictError);
        await expect(invitationService.create(input)).rejects.toThrow(
          'Invitation already sent to this email'
        );
      });
    });

    it('should convert email to lowercase', async () => {
      const input = { email: 'UPPERCASE@EXAMPLE.COM' };
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId),
        id: 'invitation-1',
      };

      (User.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockRepo.findPendingByEmail = jest.fn().mockResolvedValue(null);
      mockRepo.create = jest.fn().mockResolvedValue(mockInvitation);

      await RequestContext.run(mockContext, async () => {
        await invitationService.create(input);

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'uppercase@example.com',
          })
        );
      });
    });

    it('should default role to member if not provided', async () => {
      const input = { email: 'noRole@example.com' };
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId),
        id: 'invitation-1',
      };

      (User.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      mockRepo.findPendingByEmail = jest.fn().mockResolvedValue(null);
      mockRepo.create = jest.fn().mockResolvedValue(mockInvitation);

      await RequestContext.run(mockContext, async () => {
        await invitationService.create(input);

        expect(mockRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            role: 'member',
          })
        );
      });
    });
  });

  describe('accept', () => {
    const acceptInput = {
      token: 'valid-token-123',
      firstName: 'New',
      lastName: 'User',
      password: 'SecurePassword123!',
    };

    it('should create user and mark invitation accepted', async () => {
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId, {
          token: acceptInput.token,
          status: 'pending',
          expiresAt: new Date(Date.now() + 86400000), // Tomorrow
        }),
        id: 'invitation-1',
      };
      const mockTenant = createTenant({ tenantId: mockContext.tenantId, slug: 'test-org' });

      mockRepo.findByToken = jest.fn().mockResolvedValue(mockInvitation);
      (User.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      (Tenant.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTenant),
      });
      mockRepo.updateStatus = jest.fn().mockResolvedValue({ ...mockInvitation, status: 'accepted' });

      // Mock User constructor and save
      const savedUser = {
        ...createUser(mockContext.tenantId, {
          email: mockInvitation.email,
          firstName: acceptInput.firstName,
          lastName: acceptInput.lastName,
        }),
        id: 'new-user-id',
        save: jest.fn().mockResolvedValue(undefined),
      };
      (User as unknown as jest.Mock).mockImplementation(() => savedUser);

      const result = await invitationService.accept(acceptInput);

      expect(result.tenantSlug).toBe('test-org');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('invitation-1', 'accepted');
      expect(EventBus.emit).toHaveBeenCalledWith(
        'invitation.accepted',
        expect.objectContaining({
          invitationId: 'invitation-1',
          tenantId: mockContext.tenantId,
        })
      );
    });

    it('should throw NotFoundError when invitation does not exist', async () => {
      mockRepo.findByToken = jest.fn().mockResolvedValue(null);

      await expect(invitationService.accept(acceptInput)).rejects.toThrow(NotFoundError);
      await expect(invitationService.accept(acceptInput)).rejects.toThrow('Invitation');
    });

    it('should throw BadRequestError when invitation is already used', async () => {
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId, {
          token: acceptInput.token,
          status: 'accepted',
        }),
        id: 'invitation-1',
      };

      mockRepo.findByToken = jest.fn().mockResolvedValue(mockInvitation);

      await expect(invitationService.accept(acceptInput)).rejects.toThrow(BadRequestError);
      await expect(invitationService.accept(acceptInput)).rejects.toThrow(
        'Invitation has already been used or cancelled'
      );
    });

    it('should throw BadRequestError and mark expired when invitation is past due', async () => {
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId, {
          token: acceptInput.token,
          status: 'pending',
          expiresAt: new Date(Date.now() - 86400000), // Yesterday
        }),
        id: 'invitation-1',
      };

      mockRepo.findByToken = jest.fn().mockResolvedValue(mockInvitation);
      mockRepo.updateStatus = jest.fn().mockResolvedValue({ ...mockInvitation, status: 'expired' });

      await expect(invitationService.accept(acceptInput)).rejects.toThrow(BadRequestError);
      await expect(invitationService.accept(acceptInput)).rejects.toThrow('Invitation has expired');
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('invitation-1', 'expired');
    });

    it('should throw ConflictError if user already exists (edge case)', async () => {
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId, {
          token: acceptInput.token,
          status: 'pending',
          expiresAt: new Date(Date.now() + 86400000),
        }),
        id: 'invitation-1',
      };
      const existingUser = createUser(mockContext.tenantId, { email: mockInvitation.email });

      mockRepo.findByToken = jest.fn().mockResolvedValue(mockInvitation);
      (User.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(existingUser),
      });
      mockRepo.updateStatus = jest.fn().mockResolvedValue({ ...mockInvitation, status: 'accepted' });

      await expect(invitationService.accept(acceptInput)).rejects.toThrow(ConflictError);
      await expect(invitationService.accept(acceptInput)).rejects.toThrow(
        'User already exists in this organization'
      );
      // Should still mark as accepted
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('invitation-1', 'accepted');
    });
  });

  describe('verify', () => {
    it('should return valid result for valid pending invitation', async () => {
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId, {
          token: 'valid-token',
          status: 'pending',
          expiresAt: new Date(Date.now() + 86400000),
        }),
        id: 'invitation-1',
      };
      const mockTenant = createTenant({ tenantId: mockContext.tenantId, name: 'Test Org' });
      const mockInviter = createUser(mockContext.tenantId, {
        firstName: 'Admin',
        lastName: 'User',
      });

      mockRepo.findByToken = jest.fn().mockResolvedValue(mockInvitation);
      (Tenant.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockTenant),
      });
      (User.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockInviter),
      });

      const result = await invitationService.verify('valid-token');

      expect(result.isValid).toBe(true);
      expect(result.invitation).toEqual(mockInvitation);
      expect(result.tenantName).toBe('Test Org');
      expect(result.inviterName).toBe('Admin User');
    });

    it('should return invalid result when invitation not found', async () => {
      mockRepo.findByToken = jest.fn().mockResolvedValue(null);

      const result = await invitationService.verify('nonexistent-token');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Invitation not found');
    });

    it('should return invalid result when invitation already used', async () => {
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId, {
          token: 'used-token',
          status: 'accepted',
        }),
        id: 'invitation-1',
      };

      mockRepo.findByToken = jest.fn().mockResolvedValue(mockInvitation);

      const result = await invitationService.verify('used-token');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Invitation has already been used or cancelled');
    });

    it('should return invalid result when invitation expired', async () => {
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId, {
          token: 'expired-token',
          status: 'pending',
          expiresAt: new Date(Date.now() - 86400000),
        }),
        id: 'invitation-1',
      };

      mockRepo.findByToken = jest.fn().mockResolvedValue(mockInvitation);

      const result = await invitationService.verify('expired-token');

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Invitation has expired');
    });
  });

  describe('cancel', () => {
    it('should cancel pending invitation and emit event', async () => {
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId, {
          status: 'pending',
        }),
        id: 'invitation-1',
      };

      mockRepo.findById = jest.fn().mockResolvedValue(mockInvitation);
      mockRepo.updateStatus = jest.fn().mockResolvedValue({ ...mockInvitation, status: 'cancelled' });

      await RequestContext.run(mockContext, async () => {
        await invitationService.cancel('invitation-1');

        expect(mockRepo.updateStatus).toHaveBeenCalledWith('invitation-1', 'cancelled');
        expect(EventBus.emit).toHaveBeenCalledWith(
          'invitation.cancelled',
          expect.objectContaining({
            invitationId: 'invitation-1',
            tenantId: mockContext.tenantId,
          })
        );
      });
    });

    it('should throw NotFoundError when invitation does not exist', async () => {
      mockRepo.findById = jest.fn().mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(invitationService.cancel('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });

    it('should throw BadRequestError when invitation is not pending', async () => {
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId, {
          status: 'accepted',
        }),
        id: 'invitation-1',
      };

      mockRepo.findById = jest.fn().mockResolvedValue(mockInvitation);

      await RequestContext.run(mockContext, async () => {
        await expect(invitationService.cancel('invitation-1')).rejects.toThrow(BadRequestError);
        await expect(invitationService.cancel('invitation-1')).rejects.toThrow(
          'Cannot cancel non-pending invitation'
        );
      });
    });
  });

  describe('resend', () => {
    it('should update expiry and emit event', async () => {
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId, {
          status: 'pending',
        }),
        id: 'invitation-1',
      };

      mockRepo.findById = jest.fn().mockResolvedValue(mockInvitation);
      mockRepo.updateExpiry = jest.fn().mockResolvedValue(mockInvitation);

      await RequestContext.run(mockContext, async () => {
        const result = await invitationService.resend('invitation-1');

        expect(result).toEqual(mockInvitation);
        expect(mockRepo.updateExpiry).toHaveBeenCalledWith(
          'invitation-1',
          expect.any(Date)
        );
        expect(EventBus.emit).toHaveBeenCalledWith(
          'invitation.created',
          expect.objectContaining({
            invitationId: 'invitation-1',
          })
        );
      });
    });

    it('should throw NotFoundError when invitation does not exist', async () => {
      mockRepo.findById = jest.fn().mockResolvedValue(null);

      await RequestContext.run(mockContext, async () => {
        await expect(invitationService.resend('nonexistent')).rejects.toThrow(NotFoundError);
      });
    });

    it('should throw BadRequestError when invitation is not pending', async () => {
      const mockInvitation = {
        ...createInvitation(mockContext.tenantId, mockContext.userId, {
          status: 'cancelled',
        }),
        id: 'invitation-1',
      };

      mockRepo.findById = jest.fn().mockResolvedValue(mockInvitation);

      await RequestContext.run(mockContext, async () => {
        await expect(invitationService.resend('invitation-1')).rejects.toThrow(BadRequestError);
      });
    });
  });

  describe('list', () => {
    it('should return all invitations for tenant', async () => {
      const invitations = [
        createInvitation(mockContext.tenantId, mockContext.userId),
        createInvitation(mockContext.tenantId, mockContext.userId),
      ];

      mockRepo.findAll = jest.fn().mockResolvedValue(invitations);

      await RequestContext.run(mockContext, async () => {
        const result = await invitationService.list();

        expect(result).toEqual(invitations);
        expect(mockRepo.findAll).toHaveBeenCalledWith(mockContext.tenantId);
      });
    });
  });

  describe('listPending', () => {
    it('should return only pending invitations', async () => {
      const pendingInvitations = [
        createInvitation(mockContext.tenantId, mockContext.userId, { status: 'pending' }),
      ];

      mockRepo.findPending = jest.fn().mockResolvedValue(pendingInvitations);

      await RequestContext.run(mockContext, async () => {
        const result = await invitationService.listPending();

        expect(result).toEqual(pendingInvitations);
        expect(mockRepo.findPending).toHaveBeenCalledWith(mockContext.tenantId);
      });
    });
  });
});
