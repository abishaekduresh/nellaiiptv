import 'package:flutter/material.dart';
import '../core/api_service.dart';
import '../models/channel.dart';
import '../models/category.dart';
import '../models/language.dart';

class ChannelProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  
  List<Channel> _channels = [];
  List<Category> _allCategories = [];
  List<Language> _allLanguages = [];
  
  // Computed filter options based on available channels
  List<Category> _availableCategories = [];
  List<Language> _availableLanguages = [];

  // Selection state
  Category? _selectedCategory;
  Language? _selectedLanguage;
  
  // "Group By" mode: 'Category' (default) or 'Language'
  // Actually user says "Group by: [Category Name]".
  // And "in gropu by use categories and languages only show the options where the channesls api has in list"
  // This implies there's a big filter list that includes both OR distinct modes.
  // I will implement separate lists for now, or a unified "Group By" concept if I had a clear design.
  // Based on "Group by: All Channels", it seems like a single primary filter.
  // I will assume the user wants to switch between grouping by Category OR Language.
  // But standard UI is usually Category filter. 
  // Let's implement both but maybe the UI only exposes one? 
  // "Group by" usually means "Sort/Section by".
  // Re-reading: "in gropu by use categories and languages only show the options".
  // This might mean the dropdown has "Categories" and "Languages" as sections? 
  // Or simply mixed chips.
  // Let's store both and let UI decide. filtering logic remains.

  String _searchQuery = '';
  
  bool _isLoading = false;
  String? _error;

  List<Channel> get channels => _channels;
  List<Category> get categories => _availableCategories;
  List<Language> get languages => _availableLanguages;
  
  Category? get selectedCategory => _selectedCategory;
  Language? get selectedLanguage => _selectedLanguage;
  
  bool get isLoading => _isLoading;
  String? get error => _error;

  List<Channel> get filteredChannels {
    return _channels.where((channel) {
      bool matchesCategory = true;
      if (_selectedCategory != null) {
        matchesCategory = channel.category?.uuid == _selectedCategory!.uuid;
      }

      bool matchesLanguage = true;
      if (_selectedLanguage != null) {
         matchesLanguage = channel.language?.uuid == _selectedLanguage!.uuid;
      }

      bool matchesSearch = true;
      if (_searchQuery.isNotEmpty) {
        matchesSearch = channel.name.toLowerCase().contains(_searchQuery.toLowerCase());
      }

      return matchesCategory && matchesLanguage && matchesSearch;
    }).toList();
  }

  Future<void> fetchChannels() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Fetch everything
      final results = await Future.wait([
        _apiService.getChannels(),
        _apiService.getCategories(),
        _apiService.getLanguages(),
      ]);

      final channels = results[0] as List<Channel>;
      
      // Filter only ACTIVE channels
      final activeChannels = channels.where((c) => c.status.toLowerCase() == 'active').toList();
      
      // Sort by channel number ascending
      activeChannels.sort((a, b) {
        final numA = a.channelNumber ?? 0;
        final numB = b.channelNumber ?? 0;
        return numA.compareTo(numB);
      });
      _channels = activeChannels;
      _allCategories = results[1] as List<Category>;
      _allLanguages = results[2] as List<Language>;

      _computeAvailableFilters();

    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void _computeAvailableFilters() {
    // Categories present in channels
    final channelCatIds = _channels.map((c) => c.category?.uuid).toSet();
    _availableCategories = _allCategories.where((c) => channelCatIds.contains(c.uuid)).toList();
    _availableCategories.sort((a, b) {
      if (a.orderNumber != b.orderNumber) {
        return a.orderNumber.compareTo(b.orderNumber); // Sort by Order Number ASC
      }
      return a.name.compareTo(b.name); // Fallback to Alphabetical
    });

    // Languages present in channels
    final channelLangIds = _channels.map((c) => c.language?.uuid).toSet();
    _availableLanguages = _allLanguages.where((l) => channelLangIds.contains(l.uuid)).toList();
    _availableLanguages.sort((a, b) {
       if (a.orderNumber != b.orderNumber) {
         return a.orderNumber.compareTo(b.orderNumber); // Sort by Order Number ASC
       }
       return a.name.compareTo(b.name);
    });
  }

  void selectCategory(Category? category) {
    _selectedCategory = category;
    _selectedLanguage = null; // Reset language if category selected? Or allow mix? 
    // Classic usually does one "Group" at a time.
    notifyListeners();
  }
  
  void selectLanguage(Language? language) {
    _selectedLanguage = language;
    _selectedCategory = null; // Exclusive selection
    notifyListeners();
  }

  void search(String query) {
    _searchQuery = query;
    notifyListeners();
  }
  Future<void> rateChannel(String channelUuid, int rating) async {
    // 1. Optimistic Update Calculation
    final index = _channels.indexWhere((c) => c.uuid == channelUuid);
    Channel? originalChannel;
    
    if (index != -1) {
      originalChannel = _channels[index];
      
      // 1. Optimistic Update Removed per request
      // We will only update after API success for accurate data.
      originalChannel = _channels[index];
    }

    try {
      // 2. Perform API Call
      final responseData = await _apiService.rateChannel(channelUuid, rating);
      
      if (responseData != null && responseData['data'] != null) {
         final data = responseData['data'];
         print("DEBUG: Full Response Data Keys: ${data.keys.toList()}");
         print("DEBUG: Full Response Data: $data");
         // Assuming API returns key fields 'average_rating' and 'ratings_count'
         // Adjust keys if your API uses different naming (e.g. camelCase vs snake_case)
         print("DEBUG: Rate Response Data: $data");
         
         double? serverAvg = data['average_rating'] is num 
            ? (data['average_rating'] as num).toDouble() 
            : (data['average_rating'] is String ? double.tryParse(data['average_rating']) : null);

         
         // Fallback for average rating key
         if (serverAvg == null && data['rating'] != null) {
            serverAvg = data['rating'] is num 
               ? (data['rating'] as num).toDouble() 
               : (data['rating'] is String ? double.tryParse(data['rating']) : null);
         }

         int? serverCount = data['total_ratings'] is num 
            ? (data['total_ratings'] as num).toInt() 
            : (data['total_ratings'] is String ? int.tryParse(data['total_ratings']) : null);

         if (serverCount == null && data['ratings_count'] != null) {
            serverCount = data['ratings_count'] is num 
               ? (data['ratings_count'] as num).toInt() 
               : (data['ratings_count'] is String ? int.tryParse(data['ratings_count']) : null);
         }
            
         // Fallback for ratings count key
         if (serverCount == null && data['rating_count'] != null) {
            serverCount = data['rating_count'] is num 
               ? (data['rating_count'] as num).toInt() 
               : (data['rating_count'] is String ? int.tryParse(data['rating_count']) : null);
         }

         print("DEBUG: Parsed ServerAvg: $serverAvg, ServerCount: $serverCount");

         // Sanity Check: If server returns 0.0 (which is impossible after a rating), 
         // ignore it and keep the Optimistic value.
         if (serverAvg != null && serverAvg > 0 && serverCount != null) {
            final verifiedChannel = originalChannel!.copyWith(
               averageRating: serverAvg,
               ratingsCount: serverCount,
               userRating: rating, // Persist user's personal rating
            );
            _channels[index] = verifiedChannel;
            notifyListeners();
         } else {
            print("DEBUG: Server returned 0 or null, keeping Optimistic Update");
         }
      }
    } catch (e) {
      debugPrint("Provider: Rate Channel Error: $e");
      // Revert if API fails
      if (index != -1 && originalChannel != null) {
        _channels[index] = originalChannel;
        notifyListeners();
      }
      rethrow;
    }
  }
}
