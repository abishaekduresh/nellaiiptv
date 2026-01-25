import 'package:flutter/foundation.dart';

class PublicSettings {
  final String? appName;
  final String? logoUrl;
  final String? appLogoPngUrl;
  final String? fallbackMp4Url;
  final String? favicon;

  PublicSettings({
    this.appName,
    this.logoUrl,
    this.appLogoPngUrl,
    this.fallbackMp4Url,
    this.favicon,
  });

  factory PublicSettings.fromJson(Map<String, dynamic> json) {
    return PublicSettings(
      appName: json['app_name'],
      logoUrl: json['logo_url'] ?? json['logo'],
      appLogoPngUrl: json['app_logo_png_url'],
      fallbackMp4Url: json['fallback_404_mp4_url'],
      favicon: json['favicon'],
    );
  }
}
