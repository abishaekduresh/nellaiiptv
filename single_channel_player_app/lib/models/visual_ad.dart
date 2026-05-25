class VisualAd {
  final String uuid;
  final String title;
  final String? description;
  final String adUrl;
  final String? clickUrl;
  final String? thumbnailUrl;
  final bool isSkippable;
  final int skipAfterSeconds;
  final int durationSeconds;
  final int maxImpressionsPerSession;
  final int displayFrequency;

  const VisualAd({
    required this.uuid,
    required this.title,
    this.description,
    required this.adUrl,
    this.clickUrl,
    this.thumbnailUrl,
    required this.isSkippable,
    required this.skipAfterSeconds,
    required this.durationSeconds,
    required this.maxImpressionsPerSession,
    required this.displayFrequency,
  });

  factory VisualAd.fromJson(Map<String, dynamic> json) {
    return VisualAd(
      uuid: json['uuid'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      adUrl: json['ad_url'] as String? ?? '',
      clickUrl: json['click_url'] as String?,
      thumbnailUrl: json['thumbnail_url'] as String?,
      isSkippable: json['is_skippable'] == true || json['is_skippable'] == 1,
      skipAfterSeconds: (json['skip_after_seconds'] as num?)?.toInt() ?? 5,
      durationSeconds: (json['duration_seconds'] as num?)?.toInt() ?? 30,
      maxImpressionsPerSession:
          (json['max_impressions_per_session'] as num?)?.toInt() ?? 0,
      displayFrequency: (json['display_frequency'] as num?)?.toInt() ?? 1,
    );
  }
}
