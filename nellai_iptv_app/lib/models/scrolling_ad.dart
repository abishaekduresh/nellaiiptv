class ScrollingAd {
  final String uuid;
  final String textContent;
  final int repeatCount;    // How many times to scroll before moving to next ad
  final int scrollSpeed;   // pixels per second
  final String status;

  ScrollingAd({
    required this.uuid,
    required this.textContent,
    required this.repeatCount,
    required this.scrollSpeed,
    required this.status,
  });

  factory ScrollingAd.fromJson(Map<String, dynamic> json) {
    return ScrollingAd(
      uuid: json['uuid'] ?? '',
      textContent: json['text_content'] ?? '',
      repeatCount: json['repeat_count'] ?? 3,
      scrollSpeed: json['scroll_speed'] ?? 50,
      status: json['status'] ?? 'active',
    );
  }
}
