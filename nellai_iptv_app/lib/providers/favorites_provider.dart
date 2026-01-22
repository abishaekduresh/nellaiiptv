import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FavoritesProvider extends ChangeNotifier {
  List<String> _favoriteIds = [];
  bool _isLoading = true;

  List<String> get favoriteIds => _favoriteIds;
  bool get isLoading => _isLoading;

  FavoritesProvider() {
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    _favoriteIds = prefs.getStringList('favorite_channels') ?? [];
    _isLoading = false;
    notifyListeners();
  }

  Future<void> toggleFavorite(String channelUuid) async {
    final prefs = await SharedPreferences.getInstance();
    if (_favoriteIds.contains(channelUuid)) {
      _favoriteIds.remove(channelUuid);
    } else {
      _favoriteIds.add(channelUuid);
    }
    // Save updated list
    await prefs.setStringList('favorite_channels', _favoriteIds);
    notifyListeners();
  }

  bool isFavorite(String channelUuid) {
    return _favoriteIds.contains(channelUuid);
  }

  // Reorder support
  Future<void> reorderFavorites(int oldIndex, int newIndex) async {
    if (oldIndex < newIndex) {
      newIndex -= 1;
    }
    final String item = _favoriteIds.removeAt(oldIndex);
    _favoriteIds.insert(newIndex, item);
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList('favorite_channels', _favoriteIds);
    notifyListeners();
  }
}
