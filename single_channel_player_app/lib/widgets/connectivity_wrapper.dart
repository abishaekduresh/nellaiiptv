import 'dart:async';
import 'package:flutter/material.dart';
import 'package:internet_connection_checker_plus/internet_connection_checker_plus.dart';
import '../services/toast_service.dart';

class ConnectivityWrapper extends StatefulWidget {
  final Widget child;
  const ConnectivityWrapper({super.key, required this.child});

  @override
  State<ConnectivityWrapper> createState() => _ConnectivityWrapperState();
}

class _ConnectivityWrapperState extends State<ConnectivityWrapper> {
  StreamSubscription<InternetStatus>? _subscription;
  Timer? _debounceTimer;
  bool _isFirstCheck = true;

  @override
  void initState() {
    super.initState();
    _subscription = InternetConnection().onStatusChange.listen((status) {
      if (_isFirstCheck) {
        _isFirstCheck = false;
        // Don't show toast on app launch unless really offline? 
        // Architecture doc says: Detect No internet.
        // If launch offline -> Show Toast.
        if (status == InternetStatus.disconnected) {
             ToastService().show("No Internet Connection", type: ToastType.error);
        }
        return;
      }

      // Debounce logic
      _debounceTimer?.cancel();
      _debounceTimer = Timer(const Duration(seconds: 2), () {
        if (!mounted) return;
        
        if (status == InternetStatus.disconnected) {
          ToastService().show("No Internet Connection", type: ToastType.error);
        } else if (status == InternetStatus.connected) {
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
