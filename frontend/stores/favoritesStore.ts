import { create } from 'zustand';
import api from '@/lib/api';
import toast from 'react-hot-toast'; // or your preferred toast lib

interface FavoritesState {
  favorites: string[]; // List of channel UUIDs
  isLoaded: boolean;
  isProcessing: boolean;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (channelUuid: string, channelName: string) => Promise<void>;
  reset: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  isLoaded: false,
  isProcessing: false,

  fetchFavorites: async () => {
    try {
      const response = await api.get('/customers/favorites/ids');
      if (response.data.status) {
        set({ favorites: response.data.data || [], isLoaded: true });
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      // Optional: don't set isLoaded to true so it might retry later? 
      // Or set it true to avoid loops.
      set({ isLoaded: true }); 
    }
  },

  toggleFavorite: async (channelUuid, channelName) => {
    const { favorites, isProcessing } = get();
    if (isProcessing) return;

    // Optimistic Update
    const isCurrentlyFavorite = favorites.includes(channelUuid);
    const newFavorites = isCurrentlyFavorite
      ? favorites.filter(id => id !== channelUuid)
      : [...favorites, channelUuid];

    set({ favorites: newFavorites, isProcessing: true });
    
    // Feedback
    toast.dismiss('fav-toast'); // Dismiss previous
    toast.loading(isCurrentlyFavorite ? 'Removing from favorites...' : 'Adding to favorites...', { id: 'fav-toast' });

    try {
      const response = await api.post('/customers/favorites/toggle', { channel_uuid: channelUuid });
      
      if (response.data.status) {
          const isFavNow = response.data.data.is_favorite;
          
          // Re-sync with server truth if needed, or trust optimistic if logic matches
          if (isFavNow !== !isCurrentlyFavorite) {
               // If server says something different, correct it
               set({ 
                   favorites: isFavNow 
                     ? [...favorites.filter(id => id !== channelUuid), channelUuid] 
                     : favorites.filter(id => id !== channelUuid) 
               });
          }
           
          toast.success(isFavNow ? `Added ${channelName} to Favorites` : `Removed ${channelName} from Favorites`, { id: 'fav-toast' });
      } else {
        throw new Error(response.data.message || 'Action failed');
      }
    } catch (error) {
      console.error('Toggle favorite failed:', error);
      // Revert optimistic update
      set({ favorites });
      toast.error('Failed to update favorite', { id: 'fav-toast' });
    } finally {
      set({ isProcessing: false });
    }
  },

  reset: () => set({ favorites: [], isLoaded: false })
}));
