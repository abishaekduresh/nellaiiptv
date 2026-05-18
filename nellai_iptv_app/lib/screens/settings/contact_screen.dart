import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/api_service.dart';
import '../../core/toast_service.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final ApiService _api = ApiService();
  final _nameController    = TextEditingController();
  final _emailController   = TextEditingController();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();

  bool _isSubmitting = false;

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
    _nameController.dispose();
    _emailController.dispose();
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  /// Returns the first validation error, or null if all fields are valid.
  String? get _validationError {
    if (_nameController.text.trim().length < 2)
      return 'Name must be at least 2 characters';
    if (_emailController.text.trim().isEmpty)
      return 'Email is required';
    if (!_emailController.text.trim().contains('@'))
      return 'Enter a valid email address';
    if (_subjectController.text.trim().length < 3)
      return 'Subject must be at least 3 characters';
    if (_messageController.text.trim().length < 10)
      return 'Message must be at least 10 characters';
    return null;
  }

  Future<void> _submit() async {
    final error = _validationError;
    if (error != null) {
      ToastService().show(error, type: ToastType.error);
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await _api.submitContact(
        name:    _nameController.text.trim(),
        email:   _emailController.text.trim(),
        subject: _subjectController.text.trim(),
        message: _messageController.text.trim(),
      );

      if (mounted) {
        ToastService().show(
          'Message sent successfully. We will get back to you soon!',
          type: ToastType.success,
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ToastService().show(
          e.toString().replaceFirst('Exception: ', ''),
          type: ToastType.error,
        );
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
        title: const Text('Contact Us', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
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
                    child: const Icon(Icons.support_agent_outlined, color: Color(0xFF06B6D4), size: 32),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Get in Touch',
                    style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'We typically respond within 24 hours',
                    style: TextStyle(color: Colors.white54, fontSize: 13),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            _sectionLabel('Name'),
            const SizedBox(height: 8),
            _buildTextField(
              controller: _nameController,
              hint: 'Your full name',
              icon: Icons.person_outline,
            ),
            const SizedBox(height: 18),

            _sectionLabel('Email'),
            const SizedBox(height: 8),
            _buildTextField(
              controller: _emailController,
              hint: 'your@email.com',
              icon: Icons.email_outlined,
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 18),

            _sectionLabel('Subject'),
            const SizedBox(height: 8),
            _buildTextField(
              controller: _subjectController,
              hint: 'What is this about?',
              icon: Icons.subject_outlined,
            ),
            const SizedBox(height: 18),

            _sectionLabel('Message'),
            const SizedBox(height: 8),
            TextField(
              controller: _messageController,
              maxLines: 5,
              style: const TextStyle(color: Colors.white),
              onChanged: (_) => setState(() {}),
              onTap: () => SystemChannels.textInput.invokeMethod('TextInput.show'),
              decoration: InputDecoration(
                hintText: 'Describe your query or issue in detail...',
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
                    label: Text(_isSubmitting ? 'Sending...' : 'Send Message'),
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

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      style: const TextStyle(color: Colors.white),
      onChanged: (_) => setState(() {}),
      onTap: () => SystemChannels.textInput.invokeMethod('TextInput.show'),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white30),
        prefixIcon: Icon(icon, color: Colors.white38, size: 20),
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
    );
  }

  Widget _sectionLabel(String text) {
    return Row(
      children: [
        Text(text, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
        const Text(' *', style: TextStyle(color: Color(0xFFEF4444), fontSize: 14)),
      ],
    );
  }
}
