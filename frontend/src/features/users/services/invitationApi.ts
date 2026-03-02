import { api } from '@/shared/lib/axios';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  Invitation,
  CreateInvitationDTO,
  AcceptInvitationDTO,
  InvitationVerification,
  AcceptInvitationResponse,
} from '../types/invitation.types';

export const invitationApi = {
  list: async (): Promise<ApiResponse<Invitation[]>> => {
    const { data } = await api.get<ApiResponse<Invitation[]>>('/invitations');
    return data;
  },

  create: async (dto: CreateInvitationDTO): Promise<ApiResponse<Invitation>> => {
    const { data } = await api.post<ApiResponse<Invitation>>('/invitations', dto);
    return data;
  },

  resend: async (id: string): Promise<ApiResponse<Invitation>> => {
    const { data } = await api.post<ApiResponse<Invitation>>(`/invitations/${id}/resend`);
    return data;
  },

  cancel: async (id: string): Promise<void> => {
    await api.delete(`/invitations/${id}`);
  },

  verify: async (token: string): Promise<ApiResponse<InvitationVerification>> => {
    const { data } = await api.get<ApiResponse<InvitationVerification>>(
      `/invitations/verify/${token}`
    );
    return data;
  },

  accept: async (dto: AcceptInvitationDTO): Promise<ApiResponse<AcceptInvitationResponse>> => {
    const { data } = await api.post<ApiResponse<AcceptInvitationResponse>>(
      '/invitations/accept',
      dto
    );
    return data;
  },
};
