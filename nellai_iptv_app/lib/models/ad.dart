class Ad {
  final String uuid;
  final String title;
  final String imageUrl;
  final String? linkUrl;
  final int runTimeSeconds;

  Ad({
    required this.uuid,
    required this.title,
    required this.imageUrl,
    this.linkUrl,
    required this.runTimeSeconds,
  });

  factory Ad.fromJson(Map<String, dynamic> json) {
    return Ad(
      uuid: json['uuid'] ?? '',
      title: json['title'] ?? '',
      imageUrl: json['media_url'] ?? '',
      linkUrl: json['redirect_url'],
      runTimeSeconds: json['run_time_sec'] ?? 10,
    );
  }
}
