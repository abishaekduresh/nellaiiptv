import 'dart:async';
import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../services/toast_service.dart';

class ConnectivityWrapper extends StatefulWidget {
  final Widget child;
  const ConnectivityWrapper({super.key, required this.child});

  @override
  State<ConnectivityWrapper> createState() => _ConnectivityWrapperState();
}

class _ConnectivityWrapperState extends State<ConnectivityWrapper> {
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  Timer? _debounceTimer;
  bool _isFirstCheck = true;
  bool _wasOffline = false;

  @override
  void initState() {
    super.initState();
    _subscription = Connectivity().onConnectivityChanged.listen((results) {
      final isOffline = results.every((r) => r == ConnectivityResult.none);

      if (_isFirstCheck) {
        _isFirstCheck = false;
        _wasOffline = isOffline;
        if (isOffline) {
          ToastService().show("No Internet Connection", type: ToastType.error);
        }
        return;
      }

      _debounceTimer?.cancel();
      _debounceTimer = Timer(const Duration(seconds: 2), () {
        if (!mounted) return;
        if (isOffline && !_wasOffline) {
          _wasOffline = true;
          ToastService().show("No Internet Connection", type: ToastType.error);
        } else if (!isOffline && _wasOffline) {
          _wasOffline = false;
          ToastService().show("Back Online", type: ToastType.success);
        }
      });
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _debounceTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
