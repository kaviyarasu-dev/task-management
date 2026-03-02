import { useEffect } from 'react';
import { getSocket } from '@/shared/lib/socket';
import { usePresenceStore } from '../stores/presenceStore';

/**
 * Hook that subscribes to presence events and updates the store
 * Should be called once in a top-level component (e.g., AppLayout)
 */
export function usePresenceSubscription() {
  const setOnline = usePresenceStore((state) => state.setOnline);
  const setOffline = usePresenceStore((state) => state.setOffline);
  const setAllOnline = usePresenceStore((state) => state.setAllOnline);
  const clearAll = usePresenceStore((state) => state.clearAll);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleUserOnline = ({ userId }: { userId: string }) => {
      setOnline(userId);
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      setOffline(userId);
    };

    const handleUsersList = ({ users }: { users: Array<{ userId: string; lastSeen: string }> }) => {
      setAllOnline(users);
    };

    const handleDisconnect = () => {
      clearAll();
    };

    // Subscribe to presence events
    socket.on('presence:user_online', handleUserOnline);
    socket.on('presence:user_offline', handleUserOffline);
    socket.on('presence:users_list', handleUsersList);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('presence:user_online', handleUserOnline);
      socket.off('presence:user_offline', handleUserOffline);
      socket.off('presence:users_list', handleUsersList);
      socket.off('disconnect', handleDisconnect);
    };
  }, [setOnline, setOffline, setAllOnline, clearAll]);
}

/**
 * Hook to check if a specific user is online
 */
export function useIsOnline(userId: string): boolean {
  return usePresenceStore((state) => state.onlineUsers.has(userId));
}
