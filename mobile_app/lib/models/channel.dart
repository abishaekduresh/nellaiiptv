class Channel {
  final String uuid;
  final String name;
  final String? logoUrl;
  final String? hlsUrl;

  Channel({
    required this.uuid,
    required this.name,
    this.logoUrl,
    this.hlsUrl,
  });

  factory Channel.fromJson(Map<String, dynamic> json) {
    return Channel(
      uuid: json['uuid'] ?? '',
      name: json['name'] ?? 'Unknown Channel',
      logoUrl: json['logo_url'],
      hlsUrl: json['hls_url'],
    );
  }
}
