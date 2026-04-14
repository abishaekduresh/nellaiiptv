import { create } from 'zustand';
import api from '@/lib/api';

interface StreamStatusState {
  statuses: { [uuid: string]: boolean };
  lastChecked: { [uuid: string]: number };
  checkStatus: (uuid: string) => Promise<void>;
  getStatus: (uuid: string) => boolean | undefined;
}

export const useStreamStatusStore = create<StreamStatusState>((set, get) => ({
  statuses: {},
  lastChecked: {},
  
  getStatus: (uuid: string) => {
    return get().statuses[uuid];
  },

  checkStatus: async (uuid: string) => {
    const now = Date.now();
    const lastCheck = get().lastChecked[uuid] || 0;
    
    // Throttle checks (e.g., don't check more than once every 2 minutes unless forced)
    // Actually, for UI responsiveness, if we have a value, we keep it, but we can refresh in background.
    // Let's allow refreshing if > 2 minutes old
    if (now - lastCheck < 120000 && get().statuses[uuid] !== undefined) {
      return;
    }

    try {
      const response = await api.get(`/channels/${uuid}/stream-status`);
      if (response.data.status && response.data.data) {
        const isOnline = response.data.data.is_online;
        set((state) => ({
          statuses: { ...state.statuses, [uuid]: isOnline },
          lastChecked: { ...state.lastChecked, [uuid]: now }
        }));
      }
    } catch (err) {
      // In case of error (timeout etc), assume offline but also cache the timestamp so we don't spam
      set((state) => ({
        statuses: { ...state.statuses, [uuid]: false },
        lastChecked: { ...state.lastChecked, [uuid]: now }
      }));
    }
  }
}));
