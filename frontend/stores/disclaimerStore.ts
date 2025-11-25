import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DisclaimerState {
  hasAccepted: boolean;
  acceptDisclaimer: () => void;
}

export const useDisclaimerStore = create<DisclaimerState>()(
  persist(
    (set) => ({
      hasAccepted: false,
      acceptDisclaimer: () => set({ hasAccepted: true }),
    }),
    {
      name: 'disclaimer-storage',
    }
  )
);
