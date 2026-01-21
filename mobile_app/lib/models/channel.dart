class Channel {
  final String uuid;
  final String name;
  final String? logoUrl;
  final String? thumbnailUrl;
  final String? hlsUrl;
  final String? viewersCountFormatted;
  final double? averageRating;

  Channel({
    required this.uuid,
    required this.name,
    this.logoUrl,
    this.thumbnailUrl,
    this.hlsUrl,
    this.viewersCountFormatted,
    this.averageRating,
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
    );
  }
}
