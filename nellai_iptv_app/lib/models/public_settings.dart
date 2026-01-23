class PublicSettings {
  final String? appName;
  final String? logoUrl;
  final String? appLogoPngUrl;
  final String? favicon;

  PublicSettings({
    this.appName,
    this.logoUrl,
    this.appLogoPngUrl,
    this.favicon,
  });

  factory PublicSettings.fromJson(Map<String, dynamic> json) {
    return PublicSettings(
      appName: json['app_name'],
      logoUrl: json['logo_url'] ?? json['logo'],
      appLogoPngUrl: json['app_logo_png_url'], // New field
      favicon: json['favicon'],
    );
  }
}
