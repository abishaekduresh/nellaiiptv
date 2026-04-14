import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';

export function useFavorites() {
  const { token, user } = useAuthStore();
  const { favorites, isLoaded, fetchFavorites, toggleFavorite: storeToggle, isProcessing } = useFavoritesStore();

  useEffect(() => {
    if (token && user && !isLoaded) {
      fetchFavorites();
    }
  }, [token, user, isLoaded, fetchFavorites]);

  // Wrapper to maintain similar API, but now requires name
  // If name is missing, provide a fallback, though callers should update.
  const toggleFavorite = (channelUuid: string, channelName: string = 'Channel') => {
      storeToggle(channelUuid, channelName);
  };

  const isFavorite = (channelUuid: string) => favorites.includes(channelUuid);

  return { favorites, toggleFavorite, isFavorite, isProcessing };
}
