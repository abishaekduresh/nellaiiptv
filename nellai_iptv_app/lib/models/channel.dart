import 'category.dart';
import 'language.dart';

class Channel {
  final String uuid;
  final String name;
  final String? logoUrl;
  final String? thumbnailUrl;
  final String? hlsUrl;
  final String? viewersCountFormatted;
  final double? averageRating;
  final Category? category;
  final Language? language;

  final int? channelNumber;
  final String? village;
  final String? districtName;
  final String? stateName;

  Channel({
    required this.uuid,
    required this.name,
    this.logoUrl,
    this.thumbnailUrl,
    this.hlsUrl,
    this.viewersCountFormatted,
    this.averageRating,
    this.category,
    this.language,
    this.channelNumber,
    this.village,
    this.districtName,
    this.stateName,
  });

  factory Channel.fromJson(Map<String, dynamic> json) {
    return Channel(
      uuid: json['uuid'] ?? '',
      name: json['name'] ?? 'Unknown Channel',
      logoUrl: json['logo_url'],
      thumbnailUrl: json['thumbnail_url'],
      hlsUrl: json['hls_url'],
      viewersCountFormatted: json['viewers_count_formatted'],
      averageRating: json['average_rating']?.toDouble(),
      category: json['category'] != null ? Category.fromJson(json['category']) : null,
      language: json['language'] != null ? Language.fromJson(json['language']) : null,
      channelNumber: json['channel_number'],
      village: json['village'],
      districtName: json['district'] != null ? json['district']['name'] : null,
      stateName: json['state'] != null ? json['state']['name'] : null,
    );
  }

  String get location {
    List<String> parts = [];
    if (village != null && village!.isNotEmpty) parts.add(village!);
    if (districtName != null && districtName!.isNotEmpty) parts.add(districtName!);
    if (stateName != null && stateName!.isNotEmpty) parts.add(stateName!);
    return parts.join(', ');
  }
}
