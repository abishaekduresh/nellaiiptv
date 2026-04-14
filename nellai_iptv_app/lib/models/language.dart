class Language {
  final int id;
  final String uuid;
  final String name;
  final String code;
  final int orderNumber;

  Language({
    required this.id,
    required this.uuid,
    required this.name,
    required this.code,
    this.orderNumber = 0,
  });

  factory Language.fromJson(Map<String, dynamic> json) {
    return Language(
      id: json['id'] ?? 0,
      uuid: json['uuid'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      orderNumber: json['order_number'] ?? 0,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Language && runtimeType == other.runtimeType && uuid == other.uuid;

  @override
  int get hashCode => uuid.hashCode;
}
