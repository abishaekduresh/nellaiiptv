import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/api_service.dart';
import '../../core/toast_service.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  State<FeedbackScreen> createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final ApiService _api = ApiService();
  final TextEditingController _messageController = TextEditingController();

  String _feedbackType = 'general';
  int? _rating;
  String _issueType = '';
  bool _isSubmitting = false;

  static const _feedbackTypes = [
    {'value': 'general', 'label': 'General'},
    {'value': 'bug', 'label': 'Bug Report'},
    {'value': 'feature_request', 'label': 'Feature Request'},
    {'value': 'channel_issue', 'label': 'Channel Issue'},
    {'value': 'subscription', 'label': 'Subscription'},
  ];

  static const _issueTypes = [
    {'value': 'stream_not_working', 'label': 'Stream not working'},
    {'value': 'buffering_frequently', 'label': 'Buffering frequently'},
    {'value': 'audio_issue', 'label': 'Audio issue'},
    {'value': 'video_quality_issue', 'label': 'Video quality issue'},
    {'value': 'wrong_channel', 'label': 'Wrong channel'},
    {'value': 'other', 'label': 'Other'},
  ];

  static const _ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  @override
  void initState() {
    super.initState();
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  }

  @override
  void dispose() {
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
    _messageController.dispose();
    super.dispose();
  }

  bool get _canSubmit =>
      _messageController.text.trim().length >= 5 &&
      !(_feedbackType == 'channel_issue' && _issueType.isEmpty);

  Future<void> _submit() async {
    if (!_canSubmit) {
      if (_feedbackType == 'channel_issue' && _issueType.isEmpty) {
        ToastService().show('Please select an issue type', type: ToastType.error);
      } else {
        ToastService().show('Message must be at least 5 characters', type: ToastType.error);
      }
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await _api.submitFeedback(
        feedbackType: _feedbackType,
        rating: _rating,
        issueType: _feedbackType == 'channel_issue' ? _issueType : null,
        message: _messageController.text.trim(),
      );

      if (mounted) {
        ToastService().show('Thank you for your feedback!', type: ToastType.success);
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ToastService().show(e.toString().replaceFirst('Exception: ', ''), type: ToastType.error);
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: const Text('Share Feedback', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Center(
              child: Column(
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: const Color(0xFF06B6D4).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: const Icon(Icons.thumb_up_alt_outlined, color: Color(0xFF06B6D4), size: 32),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Help us improve',
                    style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Your feedback matters to us',
                    style: TextStyle(color: Colors.white54, fontSize: 13),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Feedback Type
            _sectionLabel('Feedback Type'),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _feedbackTypes.map((type) {
                final selected = _feedbackType == type['value'];
                return Focus(
                  onKeyEvent: (node, event) {
                    if (event is KeyDownEvent &&
                        (event.logicalKey == LogicalKeyboardKey.select ||
                         event.logicalKey == LogicalKeyboardKey.enter)) {
                      setState(() {
                        _feedbackType = type['value']!;
                        _issueType = '';
                      });
                      return KeyEventResult.handled;
                    }
                    return KeyEventResult.ignored;
                  },
                  child: Builder(builder: (ctx) {
                    final hasFocus = Focus.of(ctx).hasFocus;
                    return GestureDetector(
                      onTap: () => setState(() {
                        _feedbackType = type['value']!;
                        _issueType = '';
                      }),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: selected
                              ? const Color(0xFF06B6D4).withOpacity(0.15)
                              : const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: hasFocus
                                ? const Color(0xFF06B6D4)
                                : selected
                                    ? const Color(0xFF06B6D4)
                                    : Colors.white12,
                            width: hasFocus ? 2.5 : 1.5,
                          ),
                        ),
                        child: Text(
                          type['label']!,
                          style: TextStyle(
                            color: selected ? const Color(0xFF06B6D4) : Colors.white70,
                            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    );
                  }),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),

            // Star Rating
            _sectionLabel('Rating', optional: true),
            const SizedBox(height: 10),
            Row(
              children: List.generate(5, (i) {
                final star = i + 1;
                final filled = _rating != null && star <= _rating!;
                return Focus(
                  onKeyEvent: (node, event) {
                    if (event is KeyDownEvent &&
                        (event.logicalKey == LogicalKeyboardKey.select ||
                         event.logicalKey == LogicalKeyboardKey.enter)) {
                      setState(() => _rating = _rating == star ? null : star);
                      return KeyEventResult.handled;
                    }
                    return KeyEventResult.ignored;
                  },
                  child: Builder(builder: (ctx) {
                    final hasFocus = Focus.of(ctx).hasFocus;
                    return GestureDetector(
                      onTap: () => setState(() => _rating = _rating == star ? null : star),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding: const EdgeInsets.all(6),
                        decoration: hasFocus
                            ? BoxDecoration(
                                color: const Color(0xFF06B6D4).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFF06B6D4), width: 2),
                              )
                            : null,
                        child: Icon(
                          filled ? Icons.star_rounded : Icons.star_outline_rounded,
                          color: filled ? const Color(0xFFFBBF24) : Colors.white30,
                          size: 36,
                        ),
                      ),
                    );
                  }),
                );
              }),
            ),
            if (_rating != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(
                  _ratingLabels[_rating!],
                  style: const TextStyle(color: Color(0xFFFBBF24), fontSize: 13, fontWeight: FontWeight.w500),
                ),
              ),
            const SizedBox(height: 24),

            // Issue Type (channel_issue only)
            if (_feedbackType == 'channel_issue') ...[
              _sectionLabel('Issue Type'),
              const SizedBox(height: 10),
              ..._issueTypes.map((issue) {
                final selected = _issueType == issue['value'];
                return Focus(
                  onKeyEvent: (node, event) {
                    if (event is KeyDownEvent &&
                        (event.logicalKey == LogicalKeyboardKey.select ||
                         event.logicalKey == LogicalKeyboardKey.enter)) {
                      setState(() => _issueType = issue['value']!);
                      return KeyEventResult.handled;
                    }
                    return KeyEventResult.ignored;
                  },
                  child: Builder(builder: (ctx) {
                    final hasFocus = Focus.of(ctx).hasFocus;
                    return GestureDetector(
                      onTap: () => setState(() => _issueType = issue['value']!),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: selected
                              ? const Color(0xFFEF4444).withOpacity(0.1)
                              : const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: hasFocus
                                ? const Color(0xFF06B6D4)
                                : selected
                                    ? const Color(0xFFEF4444)
                                    : Colors.white12,
                            width: hasFocus ? 2.5 : 1.5,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 18,
                              height: 18,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: selected ? const Color(0xFFEF4444) : Colors.white38,
                                  width: 2,
                                ),
                                color: selected ? const Color(0xFFEF4444) : Colors.transparent,
                              ),
                              child: selected
                                  ? const Icon(Icons.circle, size: 8, color: Colors.white)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Text(
                              issue['label']!,
                              style: TextStyle(
                                color: selected ? Colors.white : Colors.white70,
                                fontSize: 14,
                                fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                );
              }),
              const SizedBox(height: 8),
            ],

            // Message
            _sectionLabel('Message'),
            const SizedBox(height: 10),
            TextField(
              controller: _messageController,
              maxLines: 5,
              style: const TextStyle(color: Colors.white),
              onChanged: (_) => setState(() {}),
              onTap: () => SystemChannels.textInput.invokeMethod('TextInput.show'),
              decoration: InputDecoration(
                hintText: 'Describe your feedback in detail...',
                hintStyle: const TextStyle(color: Colors.white30),
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.white12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Colors.white12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF06B6D4), width: 2),
                ),
              ),
            ),
            const SizedBox(height: 28),

            // Submit Button
            Focus(
              onKeyEvent: (node, event) {
                if (event is KeyDownEvent &&
                    (event.logicalKey == LogicalKeyboardKey.select ||
                     event.logicalKey == LogicalKeyboardKey.enter)) {
                  if (!_isSubmitting) _submit();
                  return KeyEventResult.handled;
                }
                return KeyEventResult.ignored;
              },
              child: Builder(builder: (ctx) {
                final hasFocus = Focus.of(ctx).hasFocus;
                return SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton.icon(
                    onPressed: _isSubmitting ? null : _submit,
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Icon(Icons.send_rounded),
                    label: Text(_isSubmitting ? 'Submitting...' : 'Submit Feedback'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF06B6D4),
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: const Color(0xFF06B6D4).withOpacity(0.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: hasFocus
                            ? const BorderSide(color: Colors.white, width: 2.5)
                            : BorderSide.none,
                      ),
                      textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _sectionLabel(String text, {bool optional = false}) {
    return Row(
      children: [
        Text(
          text,
          style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        if (!optional)
          const Text(' *', style: TextStyle(color: Color(0xFFEF4444), fontSize: 14)),
        if (optional)
          const Text(' (optional)', style: TextStyle(color: Colors.white38, fontSize: 12)),
      ],
    );
  }
}
