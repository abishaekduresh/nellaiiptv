import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/api_service.dart';
import '../../core/toast_service.dart';
import '../../models/customer_stream.dart';

class MyStreamsScreen extends StatefulWidget {
  const MyStreamsScreen({super.key});

  @override
  State<MyStreamsScreen> createState() => _MyStreamsScreenState();
}

class _MyStreamsScreenState extends State<MyStreamsScreen> {
  final ApiService _api = ApiService();
  List<CustomerStream> _streams = [];
  bool _isLoading = true;
  bool _isSyncing = false;
  DateTime? _lastSynced;
  final Set<String> _togglingUuids = {};

  // Cooldown state
  static const int _cooldownSeconds = 30;
  int _syncCooldown = 0;
  Timer? _syncTimer;
  final Map<String, int> _restartCooldowns = {};
  final Map<String, Timer> _restartTimers = {};

  @override
  void initState() {
    super.initState();
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    _loadStreams();
  }

  @override
  void dispose() {
    _syncTimer?.cancel();
    for (final t in _restartTimers.values) { t.cancel(); }
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    super.dispose();
  }

  void _startSyncCooldown() {
    _syncTimer?.cancel();
    setState(() => _syncCooldown = _cooldownSeconds);
    _syncTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) { timer.cancel(); return; }
      setState(() {
        _syncCooldown--;
        if (_syncCooldown <= 0) {
          _syncCooldown = 0;
          timer.cancel();
          _syncTimer = null;
        }
      });
    });
  }

  void _startRestartCooldown(String uuid) {
    _restartTimers[uuid]?.cancel();
    setState(() => _restartCooldowns[uuid] = _cooldownSeconds);
    _restartTimers[uuid] = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) { timer.cancel(); return; }
      setState(() {
        final current = _restartCooldowns[uuid] ?? 0;
        if (current <= 1) {
          _restartCooldowns.remove(uuid);
          _restartTimers.remove(uuid);
          timer.cancel();
        } else {
          _restartCooldowns[uuid] = current - 1;
        }
      });
    });
  }

  Future<void> _loadStreams({bool sync = false}) async {
    if (sync) {
      setState(() => _isSyncing = true);
    } else {
      setState(() => _isLoading = true);
    }

    try {
      final streams = await _api.getMyStreams(sync: sync);
      if (mounted) {
        setState(() {
          _streams = List<CustomerStream>.from(streams); // new list reference forces rebuild
          _isLoading = false;
          _isSyncing = false;
          _lastSynced = DateTime.now();
        });
        if (sync) {
          _startSyncCooldown();
          ToastService().show('Streams synced', type: ToastType.success);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isSyncing = false;
        });
        final msg = e.toString().replaceFirst('Exception: ', '');
        ToastService().show(msg.isNotEmpty ? msg : 'Failed to load streams', type: ToastType.error);
      }
    }
  }

  Future<void> _restartStream(CustomerStream stream) async {
    if (_togglingUuids.contains(stream.uuid)) return;

    setState(() => _togglingUuids.add(stream.uuid));

    try {
      // Step 1: disable
      await _api.toggleStream(stream.uuid, false);
      if (!mounted) return;

      // Step 2: wait 2 seconds
      await Future.delayed(const Duration(seconds: 2));
      if (!mounted) return;

      // Step 3: re-enable
      await _api.toggleStream(stream.uuid, true);
      if (!mounted) return;

      // Step 4: fetch fresh data from server
      final streams = await _api.getMyStreams(sync: true);
      if (!mounted) return;

      setState(() {
        _streams = List<CustomerStream>.from(streams);
        _lastSynced = DateTime.now();
        _togglingUuids.remove(stream.uuid);
      });

      _startRestartCooldown(stream.uuid);
      ToastService().show('Stream restarted', type: ToastType.success);
    } catch (e) {
      if (mounted) {
        setState(() => _togglingUuids.remove(stream.uuid));
        ToastService().show('Restart failed', type: ToastType.error);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text(
          'My Streams',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
        actions: [
          if (_isSyncing)
            const Padding(
              padding: EdgeInsets.all(16),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Color(0xFF06B6D4),
                ),
              ),
            )
          else if (_syncCooldown > 0)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Center(
                child: Text(
                  'Sync (${_syncCooldown}s)',
                  style: const TextStyle(
                    color: Colors.white38,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            )
          else
            IconButton(
              tooltip: 'Sync live data',
              icon: const Icon(Icons.cloud_sync_outlined, color: Color(0xFF06B6D4)),
              onPressed: () => _loadStreams(sync: true),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF06B6D4)))
          : _streams.isEmpty
              ? _buildEmptyState()
              : Column(
                  children: [
                    if (_isSyncing)
                      const LinearProgressIndicator(
                        color: Color(0xFF06B6D4),
                        backgroundColor: Color(0xFF1E293B),
                      ),
                    if (_lastSynced != null)
                      Container(
                        width: double.infinity,
                        color: const Color(0xFF1E293B),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        child: Text(
                          'Last synced: ${_formatTime(_lastSynced!)}',
                          style: const TextStyle(color: Colors.white38, fontSize: 11),
                        ),
                      ),
                    Expanded(
                      child: RefreshIndicator(
                        color: const Color(0xFF06B6D4),
                        backgroundColor: const Color(0xFF1E293B),
                        onRefresh: () => _loadStreams(sync: true),
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                          child: Column(
                            children: _streams
                                .map((stream) => _buildStreamCard(stream))
                                .toList(),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white10),
            ),
            child: const Icon(Icons.wifi_tethering_off, size: 40, color: Colors.white30),
          ),
          const SizedBox(height: 20),
          const Text(
            'No Streams Assigned',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Contact your provider to get streams assigned\nto your account.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, fontSize: 14, height: 1.5),
          ),
          const SizedBox(height: 28),
          OutlinedButton.icon(
            onPressed: () => _loadStreams(),
            icon: const Icon(Icons.refresh, color: Color(0xFF06B6D4)),
            label: const Text('Refresh', style: TextStyle(color: Color(0xFF06B6D4))),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF06B6D4)),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }

  Color _streamStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'running':
        return const Color(0xFF10B981); // green — active
      case 'waiting':
        return const Color(0xFFF59E0B); // amber — starting up
      default:
        return const Color(0xFFEF4444); // red — stopped / unknown
    }
  }

  Widget _buildStreamCard(CustomerStream stream) {
    final isToggling = _togglingUuids.contains(stream.uuid);
    final restartCooldown = _restartCooldowns[stream.uuid] ?? 0;
    final statusColor = _streamStatusColor(stream.streamStatus);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: statusColor.withValues(alpha: 0.25),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header ──────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Pulsing status dot
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: statusColor,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                              color: statusColor.withValues(alpha: 0.5),
                              blurRadius: 6),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        stream.streamName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                // Status + Health badges row
                Row(
                  children: [
                    _buildStatusBadge(
                      label: _capitalise(stream.streamStatus ?? 'Unknown'),
                      color: statusColor,
                    ),
                    const SizedBox(width: 8),
                    if (stream.healthStatus != null)
                      _buildHealthBadge(stream.healthStatus!),
                    const Spacer(),
                    // Enabled/Disabled pill
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: stream.isEnabled
                            ? const Color(0xFF0EA5E9).withValues(alpha: 0.12)
                            : Colors.white.withValues(alpha: 0.05),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: stream.isEnabled
                              ? const Color(0xFF0EA5E9).withValues(alpha: 0.3)
                              : Colors.white12,
                        ),
                      ),
                      child: Text(
                        stream.isEnabled ? 'Enabled' : 'Disabled',
                        style: TextStyle(
                          color: stream.isEnabled
                              ? const Color(0xFF0EA5E9)
                              : Colors.white38,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: Colors.white10),

          // ── Stats ────────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Row(
              children: [
                _buildStat(
                    icon: Icons.timer_outlined,
                    label: 'Uptime',
                    value: stream.formattedUptime),
                const SizedBox(width: 20),
                _buildStat(
                    icon: Icons.visibility_outlined,
                    label: 'Viewers',
                    value: stream.viewerDisplay),
                if (stream.publishedVia != null) ...[
                  const SizedBox(width: 20),
                  _buildStat(
                      icon: Icons.cast_outlined,
                      label: 'Via',
                      value: stream.publishedVia!.toUpperCase()),
                ],
              ],
            ),
          ),

          // Codec chips
          if (stream.videoCodec != null || stream.videoWidth != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  if (stream.videoCodec != null)
                    _buildChip(stream.videoCodec!.toUpperCase()),
                  if (stream.videoWidth != null && stream.videoHeight != null)
                    _buildChip('${stream.videoWidth}×${stream.videoHeight}'),
                  if (stream.fps != null)
                    _buildChip('${stream.fps!.toStringAsFixed(0)}fps'),
                  if (stream.audioCodec != null)
                    _buildChip(stream.audioCodec!.toUpperCase()),
                ],
              ),
            ),

          const SizedBox(height: 14),
          const Divider(height: 1, color: Colors.white10),

          // ── Restart action ───────────────────────────────────────
          if (stream.isEnabled)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
              child: SizedBox(
                width: double.infinity,
                height: 40,
                child: isToggling
                    ? const Center(
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFF06B6D4),
                          ),
                        ),
                      )
                    : ElevatedButton.icon(
                        onPressed: restartCooldown > 0 ? null : () => _restartStream(stream),
                        icon: const Icon(Icons.restart_alt, size: 18),
                        label: Text(
                          restartCooldown > 0 ? 'Restart (${restartCooldown}s)' : 'Restart',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: restartCooldown > 0
                              ? const Color(0xFF1E293B)
                              : const Color(0xFF0F4C75),
                          foregroundColor: restartCooldown > 0
                              ? Colors.white38
                              : Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
              ),
            ),

          // ── Client Sessions ──────────────────────────────────────
          _buildSessionsSection(stream.clients),
        ],
      ),
    );
  }

  Widget _buildStatusBadge({required String label, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        label,
        style: TextStyle(
            color: color, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _buildHealthBadge(String health) {
    final Color color;
    final IconData icon;
    switch (health.toLowerCase()) {
      case 'online':
        color = const Color(0xFF10B981); // green
        icon = Icons.check_circle_outline;
        break;
      case 'offline':
        color = Colors.redAccent; // red
        icon = Icons.cancel_outlined;
        break;
      default:
        color = Colors.grey;
        icon = Icons.help_outline;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: color),
          const SizedBox(width: 4),
          Text(
            _capitalise(health),
            style: TextStyle(
                color: color, fontSize: 11, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  Widget _buildSessionsSection(List<StreamClientSession> clients) {
    if (clients.isEmpty) {
      return ClipRRect(
        borderRadius:
            const BorderRadius.vertical(bottom: Radius.circular(16)),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: const BoxDecoration(
            border: Border(top: BorderSide(color: Colors.white10)),
          ),
          child: Row(
            children: const [
              Icon(Icons.people_outline, size: 14, color: Colors.white30),
              SizedBox(width: 8),
              Text('No active sessions',
                  style: TextStyle(color: Colors.white30, fontSize: 12)),
            ],
          ),
        ),
      );
    }

    final activeSessions = clients.where((c) => c.isActive).toList();
    final allSessions = clients;

    return ClipRRect(
      borderRadius:
          const BorderRadius.vertical(bottom: Radius.circular(16)),
      child: Theme(
        data: Theme.of(context).copyWith(
          dividerColor: Colors.transparent,
          splashColor: Colors.white10,
        ),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16),
          childrenPadding: EdgeInsets.zero,
          collapsedIconColor: Colors.white38,
          iconColor: const Color(0xFF06B6D4),
          title: Row(
            children: [
              const Icon(Icons.people_outline,
                  size: 16, color: Colors.white54),
              const SizedBox(width: 8),
              Text(
                'Client Sessions',
                style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                    fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 8),
              if (activeSessions.isNotEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${activeSessions.length} active',
                    style: const TextStyle(
                        color: Color(0xFF10B981),
                        fontSize: 10,
                        fontWeight: FontWeight.bold),
                  ),
                ),
              if (activeSessions.isEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${allSessions.length}',
                    style: const TextStyle(
                        color: Colors.white38,
                        fontSize: 10,
                        fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
          children: [
            const Divider(height: 1, color: Colors.white10),
            ...allSessions.map((s) => _buildSessionRow(s)),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionRow(StreamClientSession session) {
    final isActive = session.isActive;
    final dot = isActive ? const Color(0xFF10B981) : Colors.white24;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white10)),
      ),
      child: Row(
        children: [
          // Active/inactive dot
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: dot, shape: BoxShape.circle),
          ),
          const SizedBox(width: 10),
          // IP
          Expanded(
            child: Text(
              session.ip ?? '—',
              style: TextStyle(
                color: isActive ? Colors.white : Colors.white54,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Protocol chip
          if (session.protocol != null)
            _buildChip(session.protocol!.toUpperCase()),
          const SizedBox(width: 8),
          // Country
          if (session.country != null)
            Text(
              session.country!,
              style: const TextStyle(color: Colors.white38, fontSize: 12),
            ),
          const SizedBox(width: 8),
          // Duration
          Text(
            session.sessionDuration,
            style: TextStyle(
              color: isActive
                  ? const Color(0xFF06B6D4)
                  : Colors.white30,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  String _capitalise(String s) =>
      s.isEmpty ? s : '${s[0].toUpperCase()}${s.substring(1).toLowerCase()}';

  Widget _buildStat({required IconData icon, required String label, required String value}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 13, color: Colors.white38),
            const SizedBox(width: 4),
            Text(label, style: const TextStyle(color: Colors.white38, fontSize: 11)),
          ],
        ),
        const SizedBox(height: 3),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    final s = dt.second.toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  Widget _buildChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.07),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.white12),
      ),
      child: Text(
        label,
        style: const TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.w500),
      ),
    );
  }
}
