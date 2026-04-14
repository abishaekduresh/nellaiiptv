import { useState, useEffect, useCallback } from 'react';
import { Channel } from '@/types';

const HISTORY_KEY = 'nellai_ipc_watch_history';
const MAX_HISTORY = 10;

export function useWatchHistory() {
  const [history, setHistory] = useState<Channel[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const addToHistory = useCallback((channel: Channel) => {
    setHistory(prev => {
      // Remove if exists to move to top
      const filtered = prev.filter(c => c.uuid !== channel.uuid);
      const newHistory = [channel, ...filtered].slice(0, MAX_HISTORY);
      
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (e) {
        console.error("Failed to save history", e);
      }
      
      return newHistory;
    });
  }, []);

  const clearHistory = useCallback(() => {
      localStorage.removeItem(HISTORY_KEY);
      setHistory([]);
  }, []);

  return { history, addToHistory, clearHistory };
}
