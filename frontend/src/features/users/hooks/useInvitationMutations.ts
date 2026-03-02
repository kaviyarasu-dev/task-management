import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { invitationApi } from '../services/invitationApi';
import { toast } from '@/shared/stores/toastStore';
import type { CreateInvitationDTO, AcceptInvitationDTO } from '../types/invitation.types';
import type { ApiError } from '@/shared/types/api.types';

export function useInvitationMutations() {
  const queryClient = useQueryClient();

  const createInvitation = useMutation({
    mutationFn: (dto: CreateInvitationDTO) => invitationApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({ type: 'success', title: 'Invitation sent!' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({
        type: 'error',
        title: 'Failed to send invitation',
        message: error.response?.data?.message,
      });
    },
  });

  const resendInvitation = useMutation({
    mutationFn: (id: string) => invitationApi.resend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({ type: 'success', title: 'Invitation resent!' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({
        type: 'error',
        title: 'Failed to resend invitation',
        message: error.response?.data?.message,
      });
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: (id: string) => invitationApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({ type: 'success', title: 'Invitation cancelled' });
    },
    onError: (error: AxiosError<ApiError>) => {
      toast({
        type: 'error',
        title: 'Failed to cancel invitation',
        message: error.response?.data?.message,
      });
    },
  });

  const acceptInvitation = useMutation({
    mutationFn: (dto: AcceptInvitationDTO) => invitationApi.accept(dto),
  });

  return {
    createInvitation,
    resendInvitation,
    cancelInvitation,
    acceptInvitation,
  };
}
