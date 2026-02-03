'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function NetworkStatusMonitor() {
  useNetworkStatus();
  return null;
}
