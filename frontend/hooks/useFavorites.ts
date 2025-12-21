import { useState, useEffect } from 'react';
import { Channel } from '@/types';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  
  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  const toggleFavorite = (channelUuid: string) => {
    let newFavorites;
    if (favorites.includes(channelUuid)) {
      newFavorites = favorites.filter(id => id !== channelUuid);
    } else {
      newFavorites = [...favorites, channelUuid];
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const isFavorite = (channelUuid: string) => favorites.includes(channelUuid);

  return { favorites, toggleFavorite, isFavorite };
}
