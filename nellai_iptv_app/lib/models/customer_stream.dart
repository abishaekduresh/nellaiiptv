class StreamClientSession {
  final String? ip;
  final String? protocol;
  final String? country;
  final String? openedAt;
  final String? closedAt;

  StreamClientSession({
    this.ip,
    this.protocol,
    this.country,
    this.openedAt,
    this.closedAt,
  });

  factory StreamClientSession.fromJson(Map<String, dynamic> json) {
    return StreamClientSession(
      ip: json['ip']?.toString(),
      protocol: json['protocol']?.toString(),
      country: json['country']?.toString(),
      openedAt: json['opened_at']?.toString(),
      closedAt: json['closed_at']?.toString(),
    );
  }

  bool get isActive => closedAt == null;

  String get sessionDuration {
    if (openedAt == null) return '';
    final opened = DateTime.tryParse(openedAt!);
    if (opened == null) return '';
    final end = closedAt != null
        ? (DateTime.tryParse(closedAt!) ?? DateTime.now())
        : DateTime.now();
    final diff = end.difference(opened);
    if (diff.inHours > 0) return '${diff.inHours}h ${diff.inMinutes % 60}m';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ${diff.inSeconds % 60}s';
    return '${diff.inSeconds}s';
  }
}

class CustomerStream {
  final String uuid;
  final String streamName;
  final String? healthStatus;
  final String? streamStatus;
  final String status;
  final String? publishedVia;
  final String? publishedFrom;
  final int? uptime;
  final int? onlineClients;
  final int? maxSessions;
  final int? clientCount;
  final String? videoCodec;
  final int? videoWidth;
  final int? videoHeight;
  final double? fps;
  final String? audioCodec;
  final int? audioBitrate;
  final String? assignedAt;
  final List<StreamClientSession> clients;

  CustomerStream({
    required this.uuid,
    required this.streamName,
    this.healthStatus,
    this.streamStatus,
    required this.status,
    this.publishedVia,
    this.publishedFrom,
    this.uptime,
    this.onlineClients,
    this.maxSessions,
    this.clientCount,
    this.videoCodec,
    this.videoWidth,
    this.videoHeight,
    this.fps,
    this.audioCodec,
    this.audioBitrate,
    this.assignedAt,
    this.clients = const [],
  });

  factory CustomerStream.fromJson(Map<String, dynamic> json) {
    final rawClients = json['clients'];
    final clients = (rawClients is List)
        ? rawClients
            .whereType<Map<String, dynamic>>()
            .map(StreamClientSession.fromJson)
            .toList()
        : <StreamClientSession>[];

    return CustomerStream(
      uuid: json['uuid']?.toString() ?? '',
      streamName: json['stream_name']?.toString() ?? 'Unknown Stream',
      healthStatus: json['health_status']?.toString(),
      streamStatus: json['stream_status']?.toString(),
      status: json['status']?.toString() ?? 'inactive',
      publishedVia: json['published_via']?.toString(),
      publishedFrom: json['published_from']?.toString(),
      uptime: json['uptime'] is int ? json['uptime'] : int.tryParse(json['uptime']?.toString() ?? ''),
      onlineClients: json['online_clients'] is int ? json['online_clients'] : int.tryParse(json['online_clients']?.toString() ?? ''),
      maxSessions: json['max_sessions'] is int ? json['max_sessions'] : int.tryParse(json['max_sessions']?.toString() ?? ''),
      clientCount: json['client_count'] is int ? json['client_count'] : int.tryParse(json['client_count']?.toString() ?? ''),
      videoCodec: json['video_codec']?.toString(),
      videoWidth: json['video_width'] is int ? json['video_width'] : int.tryParse(json['video_width']?.toString() ?? ''),
      videoHeight: json['video_height'] is int ? json['video_height'] : int.tryParse(json['video_height']?.toString() ?? ''),
      fps: json['fps'] is double ? json['fps'] : double.tryParse(json['fps']?.toString() ?? ''),
      audioCodec: json['audio_codec']?.toString(),
      audioBitrate: json['audio_bitrate'] is int ? json['audio_bitrate'] : int.tryParse(json['audio_bitrate']?.toString() ?? ''),
      assignedAt: json['assigned_at']?.toString(),
      clients: clients,
    );
  }

  bool get isOnline => streamStatus == 'online';
  bool get isEnabled => status == 'active';

  String get formattedUptime {
    if (uptime == null || uptime == 0) return '--';
    final totalSeconds = uptime! ~/ 1000;
    final days = totalSeconds ~/ 86400;
    final hours = (totalSeconds % 86400) ~/ 3600;
    final minutes = (totalSeconds % 3600) ~/ 60;
    if (days > 0) return '${days}d ${hours}h';
    if (hours > 0) return '${hours}h ${minutes}m';
    return '${minutes}m';
  }

  String get viewerDisplay {
    final current = onlineClients ?? clientCount ?? 0;
    if (maxSessions != null && maxSessions! > 0) return '$current / $maxSessions';
    return '$current';
  }

  CustomerStream copyWith({String? status}) {
    return CustomerStream(
      uuid: uuid,
      streamName: streamName,
      healthStatus: healthStatus,
      streamStatus: streamStatus,
      status: status ?? this.status,
      publishedVia: publishedVia,
      publishedFrom: publishedFrom,
      uptime: uptime,
      onlineClients: onlineClients,
      maxSessions: maxSessions,
      clientCount: clientCount,
      videoCodec: videoCodec,
      videoWidth: videoWidth,
      videoHeight: videoHeight,
      fps: fps,
      audioCodec: audioCodec,
      audioBitrate: audioBitrate,
      assignedAt: assignedAt,
      clients: clients,
    );
  }
}
