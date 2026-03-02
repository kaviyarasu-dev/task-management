import { useQuery } from '@tanstack/react-query';
import { invitationApi } from '../services/invitationApi';

export function useInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: () => invitationApi.list(),
    staleTime: 60 * 1000,
  });
}

export function useVerifyInvitation(token: string) {
  return useQuery({
    queryKey: ['invitation', 'verify', token],
    queryFn: () => invitationApi.verify(token),
    enabled: !!token,
    retry: false,
  });
}
