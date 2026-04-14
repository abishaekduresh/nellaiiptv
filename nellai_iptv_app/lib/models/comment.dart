class Comment {
  final int id;
  final String userId;
  final String userName;
  final String comment;
  final DateTime createdAt;

  Comment({
    required this.id,
    required this.userId,
    required this.userName,
    required this.comment,
    required this.createdAt,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] is String ? int.parse(json['id']) : json['id'],
      userId: json['customer'] != null ? json['customer']['id'].toString() : (json['customer_id']?.toString() ?? ''),
      userName: json['customer'] != null ? json['customer']['name'] : 'Unknown User',
      comment: json['comment'] ?? '',
      createdAt: _parseDate(json['created_at']),
    );
  }

  static DateTime _parseDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return DateTime.now();
    try {
      // If the string doesn't have a 'Z' or offset, assume it's UTC and append 'Z'
      // effectively treating it as UTC time.
      if (!dateStr.endsWith('Z') && !dateStr.contains('+')) {
         dateStr = '${dateStr}Z';
      }
      return DateTime.parse(dateStr).toLocal();
    } catch (_) {
      return DateTime.now();
    }
  }
}
