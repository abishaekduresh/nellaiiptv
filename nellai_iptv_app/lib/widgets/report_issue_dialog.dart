import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/api_service.dart';
import '../core/toast_service.dart';

class ReportIssueDialog extends StatefulWidget {
  final String channelUuid;
  final String channelName;

  const ReportIssueDialog({
    super.key,
    required this.channelUuid,
    required this.channelName,
  });

  @override
  State<ReportIssueDialog> createState() => _ReportIssueDialogState();
}

class _ReportIssueDialogState extends State<ReportIssueDialog> {
  final ApiService _api = ApiService();
  final TextEditingController _descriptionController = TextEditingController();
  final FocusNode _descriptionFocusNode = FocusNode();
  
  String? _selectedIssue;
  bool _isSubmitting = false;

  static const List<String> _issueTypes = [
    'Stream not working',
    'Buffering frequently',
    'Audio issue',
    'Video quality issue',
    'Wrong channel',
    'Other',
  ];

  @override
  void dispose() {
    _descriptionController.dispose();
    _descriptionFocusNode.dispose();
    super.dispose();
  }

  Future<void> _submitReport() async {
    if (_selectedIssue == null) {
      ToastService().show('Please select an issue type', type: ToastType.error);
      return;
    }

    if (_selectedIssue == 'Other' && _descriptionController.text.trim().isEmpty) {
      ToastService().show('Please describe the issue', type: ToastType.error);
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final issueType = _selectedIssue == 'Other' 
          ? _descriptionController.text.trim() 
          : _selectedIssue!;
      
      final description = _selectedIssue == 'Other' 
          ? _descriptionController.text.trim() 
          : null;

      await _api.reportChannelIssue(widget.channelUuid, issueType, description: description);
      
      if (mounted) {
        ToastService().show('Report submitted. Thanks for your feedback!', type: ToastType.success);
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ToastService().show('Failed to submit report. Please try again.', type: ToastType.error);
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500, maxHeight: 600),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                const Icon(Icons.flag, color: Color(0xFFEF4444), size: 28),
                const SizedBox(width: 12),
                const Text(
                  'Report Issue',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70),
                  onPressed: () => Navigator.of(context).pop(),
                  focusColor: const Color(0xFF334155),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            // Description
            RichText(
              text: TextSpan(
                style: const TextStyle(color: Colors.white70, fontSize: 15),
                children: [
                  const TextSpan(text: 'What is wrong with '),
                  TextSpan(
                    text: widget.channelName,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const TextSpan(text: '?'),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Issue Types List
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _issueTypes.length,
                itemBuilder: (context, index) {
                  final issue = _issueTypes[index];
                  final isSelected = _selectedIssue == issue;
                  
                  return Column(
                    children: [
                      Focus(
                        onKeyEvent: (node, event) {
                          if (event is KeyDownEvent) {
                            if (event.logicalKey == LogicalKeyboardKey.select ||
                                event.logicalKey == LogicalKeyboardKey.enter ||
                                event.logicalKey == LogicalKeyboardKey.numpadEnter ||
                                event.logicalKey == LogicalKeyboardKey.space) {
                              setState(() => _selectedIssue = issue);
                              return KeyEventResult.handled;
                            }
                          }
                          return KeyEventResult.ignored;
                        },
                        child: Builder(
                          builder: (context) {
                            final hasFocus = Focus.of(context).hasFocus;
                            return InkWell(
                              onTap: () => setState(() => _selectedIssue = issue),
                              autofocus: index == 0,
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                decoration: BoxDecoration(
                                  color: isSelected 
                                      ? const Color(0xFFEF4444).withOpacity(0.1)
                                      : const Color(0xFF334155),
                                  border: Border.all(
                                    color: hasFocus
                                        ? const Color(0xFF06B6D4)
                                        : (isSelected ? const Color(0xFFEF4444) : Colors.transparent),
                                    width: hasFocus ? 3 : 2,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                  boxShadow: hasFocus ? [
                                    BoxShadow(
                                      color: const Color(0xFF06B6D4).withOpacity(0.4),
                                      blurRadius: 8,
                                      spreadRadius: 1,
                                    )
                                  ] : [],
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 20,
                                      height: 20,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: isSelected ? const Color(0xFFEF4444) : Colors.white54,
                                          width: 2,
                                        ),
                                        color: isSelected ? const Color(0xFFEF4444) : Colors.transparent,
                                      ),
                                      child: isSelected
                                          ? const Center(
                                              child: Icon(Icons.circle, size: 10, color: Colors.white),
                                            )
                                          : null,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        issue,
                                        style: TextStyle(
                                          color: isSelected ? Colors.white : Colors.white70,
                                          fontSize: 15,
                                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }
                        ),
                      ),
                      
                      // Show text input for "Other"
                      if (issue == 'Other' && isSelected) ...[
                        const SizedBox(height: 12),
                        Focus(
                          focusNode: _descriptionFocusNode,
                          onKeyEvent: (node, event) {
                            if (event is KeyDownEvent && 
                                (event.logicalKey == LogicalKeyboardKey.select ||
                                 event.logicalKey == LogicalKeyboardKey.enter)) {
                              SystemChannels.textInput.invokeMethod('TextInput.show');
                              return KeyEventResult.handled;
                            }
                            return KeyEventResult.ignored;
                          },
                          child: TextField(
                            controller: _descriptionController,
                            autofocus: true,
                            maxLines: 3,
                            style: const TextStyle(color: Colors.white),
                            decoration: InputDecoration(
                              hintText: 'Please describe the issue...',
                              hintStyle: const TextStyle(color: Colors.white38),
                              filled: true,
                              fillColor: const Color(0xFF0F172A),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: const BorderSide(color: Color(0xFF475569)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: const BorderSide(color: Color(0xFF475569)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: const BorderSide(color: Color(0xFF06B6D4), width: 2),
                              ),
                            ),
                            onTap: () {
                              SystemChannels.textInput.invokeMethod('TextInput.show');
                            },
                          ),
                        ),
                      ],
                      
                      const SizedBox(height: 8),
                    ],
                  );
                },
              ),
            ),

            const SizedBox(height: 20),

            // Submit Button
            Focus(
              onKeyEvent: (node, event) {
                if (event is KeyDownEvent) {
                  if (event.logicalKey == LogicalKeyboardKey.select ||
                      event.logicalKey == LogicalKeyboardKey.enter ||
                      event.logicalKey == LogicalKeyboardKey.numpadEnter ||
                      event.logicalKey == LogicalKeyboardKey.space) {
                    if (!_isSubmitting) {
                      _submitReport();
                    }
                    return KeyEventResult.handled;
                  }
                }
                return KeyEventResult.ignored;
              },
              child: Builder(
                builder: (context) {
                  final hasFocus = Focus.of(context).hasFocus;
                  return SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitReport,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          side: hasFocus 
                              ? const BorderSide(color: Color(0xFF06B6D4), width: 3)
                              : BorderSide.none,
                        ),
                        disabledBackgroundColor: const Color(0xFFEF4444).withOpacity(0.5),
                      ),
                      child: Text(
                        _isSubmitting ? 'Submitting...' : 'Submit Report',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  );
                }
              ),
            ),
          ],
        ),
      ),
    );
  }
}
