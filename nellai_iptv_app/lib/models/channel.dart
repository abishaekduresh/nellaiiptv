import 'category.dart';
import 'language.dart';

class Channel {
  final String uuid;
  final String name;
  final String? logoUrl;
  final String? thumbnailUrl;
  final String? hlsUrl;
  final String? viewersCountFormatted;
  final int? ratingsCount;
  final int? userRating; // The rating given by the current user (if any)
  final double? averageRating;
  final Category? category;
  final Language? language;

  final int? channelNumber;
  final String? village;
  final String? districtName;
  final String? stateName;
  final String status; // 'active', 'inactive', or 'blocked'

  final bool isPremium;

  Channel({
    required this.uuid,
    required this.name,
    this.logoUrl,
    this.thumbnailUrl,
    this.hlsUrl,
    this.viewersCountFormatted,
    this.averageRating,
    this.userRating, // Add this
    this.ratingsCount, // Add this
    this.category,
    this.language,
    this.channelNumber,
    this.village,
    this.districtName,
    this.stateName,
    this.status = 'active', // Default to active
    this.isPremium = false,
  });

  static bool _hasLoggedKeys = false;
  factory Channel.fromJson(Map<String, dynamic> json) {
    if (!_hasLoggedKeys) {
      print("DEBUG: Channel JSON Keys: ${json.keys.toList()}");
      _hasLoggedKeys = true;
    }
    // Debug Log to inspect what backend is returning
    if (json['average_rating'] != null || json['ratings_count'] != null) {
      print("DEBUG: Channel ${json['name']} - Avg: ${json['average_rating']} (${json['average_rating'].runtimeType}), Count: ${json['ratings_count']} (${json['ratings_count'].runtimeType})");
    }

    return Channel(
      uuid: json['uuid'] ?? '',
      name: json['name'] ?? 'Unknown Channel',
      logoUrl: json['logo_url'],
      thumbnailUrl: json['thumbnail_url'],
      hlsUrl: json['hls_url'],
      viewersCountFormatted: json['viewers_count_formatted'],
      averageRating: json['average_rating'] is String 
          ? double.tryParse(json['average_rating']) 
          : (json['average_rating'] as num?)?.toDouble()
          ?? (json['rating'] is String 
              ? double.tryParse(json['rating']) 
              : (json['rating'] as num?)?.toDouble()),
      
      userRating: json['user_rating'] is String 
          ? int.tryParse(json['user_rating']) 
          : (json['user_rating'] as num?)?.toInt(),
          
      ratingsCount: json['ratings_count'] is String 
          ? int.tryParse(json['ratings_count']) 
          : (json['ratings_count'] as num?)?.toInt()
          ?? (json['rating_count'] is String 
              ? int.tryParse(json['rating_count']) 
              : (json['rating_count'] as num?)?.toInt()),
      
      category: json['category'] != null ? Category.fromJson(json['category']) : null,
      language: json['language'] != null ? Language.fromJson(json['language']) : null,
      channelNumber: json['channel_number'],
      village: json['village'],
      districtName: json['district'] != null ? json['district']['name'] : null,
      stateName: json['state'] != null ? json['state']['name'] : null,
      status: json['status'] ?? 'active',
      isPremium: (json['is_premium'] == true || json['is_premium'] == 1 || json['is_premium'] == '1' || json['is_premium'].toString().toLowerCase() == 'true'),
    );
  }

  String get location {
    List<String> parts = [];
    if (village != null && village!.isNotEmpty) parts.add(village!);
    if (districtName != null && districtName!.isNotEmpty) parts.add(districtName!);
    if (stateName != null && stateName!.isNotEmpty) parts.add(stateName!);
    return parts.join(', ');
  }

  Channel copyWith({
    String? uuid,
    String? name,
    String? logoUrl,
    String? thumbnailUrl,
    String? hlsUrl,
    String? viewersCountFormatted,
    int? ratingsCount,
    double? averageRating,
    int? userRating, // Add this
    Category? category,
    Language? language,
    int? channelNumber,
    String? village,
    String? districtName,
    String? stateName,
    String? status,
    bool? isPremium,
  }) {
    return Channel(
      uuid: uuid ?? this.uuid,
      name: name ?? this.name,
      logoUrl: logoUrl ?? this.logoUrl,
      thumbnailUrl: thumbnailUrl ?? this.thumbnailUrl,
      hlsUrl: hlsUrl ?? this.hlsUrl,
      viewersCountFormatted: viewersCountFormatted ?? this.viewersCountFormatted,
      ratingsCount: ratingsCount ?? this.ratingsCount,
      averageRating: averageRating ?? this.averageRating,
      userRating: userRating ?? this.userRating, // Add this
      category: category ?? this.category,
      language: language ?? this.language,
      channelNumber: channelNumber ?? this.channelNumber,
      village: village ?? this.village,
      districtName: districtName ?? this.districtName,
      stateName: stateName ?? this.stateName,
      status: status ?? this.status,
      isPremium: isPremium ?? this.isPremium,
    );
  }
}
