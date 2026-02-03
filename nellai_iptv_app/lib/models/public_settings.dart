import 'package:flutter/foundation.dart';

class PublicSettings {
  final String? appName;
  final String? logoUrl;
  final String? appLogoPngUrl;
  final String? fallbackHlsUrl;
  final String? favicon;

  PublicSettings({
    this.appName,
    this.logoUrl,
    this.appLogoPngUrl,
    this.fallbackHlsUrl,
    this.favicon,
  });

  factory PublicSettings.fromJson(Map<String, dynamic> json) {
    return PublicSettings(
      appName: json['app_name'],
      logoUrl: json['logo_url'] ?? json['logo'],
      appLogoPngUrl: json['app_logo_png_url'],
      fallbackHlsUrl: json['fallback_404_hls_url'],
      favicon: json['favicon'],
    );
  }
}
