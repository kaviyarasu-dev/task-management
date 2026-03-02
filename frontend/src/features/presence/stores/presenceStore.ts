import { create } from 'zustand';

interface OnlineUser {
  userId: string;
  lastSeen: Date;
}

interface PresenceState {
  // Data
  onlineUsers: Map<string, OnlineUser>;

  // Actions
  setOnline: (userId: string) => void;
  setOffline: (userId: string) => void;
  setAllOnline: (users: Array<{ userId: string; lastSeen: string }>) => void;
  clearAll: () => void;

  // Selectors
  isOnline: (userId: string) => boolean;
  getOnlineUserIds: () => string[];
  getOnlineCount: () => number;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  // Initial state
  onlineUsers: new Map(),

  // Actions
  setOnline: (userId) =>
    set((state) => {
      const newMap = new Map(state.onlineUsers);
      newMap.set(userId, { userId, lastSeen: new Date() });
      return { onlineUsers: newMap };
    }),

  setOffline: (userId) =>
    set((state) => {
      const newMap = new Map(state.onlineUsers);
      newMap.delete(userId);
      return { onlineUsers: newMap };
    }),

  setAllOnline: (users) =>
    set(() => {
      const newMap = new Map<string, OnlineUser>();
      users.forEach(({ userId, lastSeen }) => {
        newMap.set(userId, { userId, lastSeen: new Date(lastSeen) });
      });
      return { onlineUsers: newMap };
    }),

  clearAll: () =>
    set({ onlineUsers: new Map() }),

  // Selectors
  isOnline: (userId) => get().onlineUsers.has(userId),

  getOnlineUserIds: () => Array.from(get().onlineUsers.keys()),

  getOnlineCount: () => get().onlineUsers.size,
}));

// Convenience hooks for common selectors
export const useIsUserOnline = (userId: string) =>
  usePresenceStore((state) => state.onlineUsers.has(userId));

export const useOnlineUserIds = () =>
  usePresenceStore((state) => Array.from(state.onlineUsers.keys()));

export const useOnlineCount = () =>
  usePresenceStore((state) => state.onlineUsers.size);
