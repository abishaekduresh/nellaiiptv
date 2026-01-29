import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

class CommonErrorScreen extends StatefulWidget {
  final String title;
  final String message;
  final String buttonText;
  final VoidCallback onRetry;
  final bool isNetworkError;

  const CommonErrorScreen({
    super.key,
    required this.title,
    required this.message,
    required this.onRetry,
    this.buttonText = "Retry",
    this.isNetworkError = false,
  });

  @override
  State<CommonErrorScreen> createState() => _CommonErrorScreenState();
}

class _CommonErrorScreenState extends State<CommonErrorScreen> {
  final FocusNode _buttonFocusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    // Auto-focus the retry button for TV/Remote users
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _buttonFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _buttonFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                widget.isNetworkError ? Icons.wifi_off_rounded : Icons.error_outline_rounded,
                size: 80,
                color: Colors.redAccent,
              )
              .animate(onPlay: (controller) => controller.repeat(reverse: true))
              .scale(
                begin: const Offset(1, 1),
                end: const Offset(1.1, 1.1),
                duration: 1000.ms,
                curve: Curves.easeInOut,
              )
              .animate()
              .fadeIn(duration: 600.ms)
              .shake(delay: 200.ms, duration: 500.ms),
              const SizedBox(height: 24),
              Text(
                widget.title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              )
              .animate()
              .fadeIn(duration: 600.ms, delay: 300.ms)
              .slideY(begin: 0.3, end: 0),
              const SizedBox(height: 16),
              Text(
                widget.message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 16,
                ),
              )
              .animate()
              .fadeIn(duration: 600.ms, delay: 500.ms)
              .slideY(begin: 0.3, end: 0),
              const SizedBox(height: 32),
              Focus(
                focusNode: _buttonFocusNode,
                onKeyEvent: (node, event) {
                  if (event is KeyDownEvent &&
                      (event.logicalKey == LogicalKeyboardKey.select ||
                          event.logicalKey == LogicalKeyboardKey.enter)) {
                    widget.onRetry();
                    return KeyEventResult.handled;
                  }
                  return KeyEventResult.ignored;
                },
                child: ListenableBuilder(
                  listenable: _buttonFocusNode,
                  builder: (context, child) {
                    return ElevatedButton.icon(
                      onPressed: widget.onRetry,
                      icon: const Icon(Icons.refresh),
                      label: Text(widget.buttonText),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _buttonFocusNode.hasFocus 
                            ? Colors.white 
                            : const Color(0xFF06B6D4),
                        foregroundColor: _buttonFocusNode.hasFocus 
                            ? const Color(0xFF0F172A) 
                            : Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                        iconColor: _buttonFocusNode.hasFocus 
                            ? const Color(0xFF0F172A) 
                            : Colors.white,
                        elevation: _buttonFocusNode.hasFocus ? 10 : 2,
                      ),
                    );
                  },
                )
                .animate(target: _buttonFocusNode.hasFocus ? 1 : 0)
                .scale(
                  begin: const Offset(1, 1),
                  end: const Offset(1.1, 1.1),
                  duration: 200.ms,
                  curve: Curves.easeOut,
                ),
              )
              .animate()
              .fadeIn(duration: 600.ms, delay: 700.ms)
              .slideY(begin: 0.3, end: 0),
            ],
          ),
        ),
      ),
    );
  }
}
