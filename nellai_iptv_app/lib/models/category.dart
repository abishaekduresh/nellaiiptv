class Category {
  final int id;
  final String uuid;
  final String name;
  final int orderNumber;

  Category({required this.id, required this.uuid, required this.name, this.orderNumber = 0});

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] ?? 0,
      uuid: json['uuid'] ?? '',
      name: json['name'] ?? 'Unknown',
      orderNumber: json['order_number'] ?? 0,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Category && other.id == id && other.name == name;
  }

  @override
  int get hashCode => id.hashCode ^ name.hashCode;
}
