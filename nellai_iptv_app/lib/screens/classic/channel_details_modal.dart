import 'package:flutter/material.dart';
import '../../models/channel.dart';
import '../../models/comment.dart';
import '../../core/api_service.dart';
import '../../core/toast_service.dart';
import '../../core/device_utils.dart'; // Import DeviceUtils
import 'package:shared_preferences/shared_preferences.dart';
import '../auth/login_screen.dart';
import 'package:flutter/services.dart'; // For orientation
import 'package:intl/intl.dart';

class ChannelDetailsModal extends StatefulWidget {
  final Channel channel;
  final bool isLoggedIn;
  final VoidCallback? onLoginRequested;

  const ChannelDetailsModal({
    super.key,
    required this.channel,
    required this.isLoggedIn,
    this.onLoginRequested,
  });

  @override
  State<ChannelDetailsModal> createState() => _ChannelDetailsModalState();
}

class _ChannelDetailsModalState extends State<ChannelDetailsModal> {
  final ApiService _api = ApiService();
  final TextEditingController _commentController = TextEditingController();
  late FocusNode _commentFocusNode;
  final FocusNode _postBtnFocusNode = FocusNode();
  
  List<Comment> _comments = [];
  bool _isLoadingComments = true;
  bool _isPostingComment = false;
  @override
  void initState() {
    super.initState();
    
    // Custom key event handler for comment input
    _commentFocusNode = FocusNode(onKeyEvent: _handleKeyEvent);
    
    _loadComments();
  }
  
  // Handle D-Pad Select/Enter for opening keyboard
  KeyEventResult _handleKeyEvent(FocusNode node, KeyEvent event) {
    if (event is KeyDownEvent && 
        (event.logicalKey == LogicalKeyboardKey.select || 
         event.logicalKey == LogicalKeyboardKey.enter)) {
      SystemChannels.textInput.invokeMethod('TextInput.show');
      return KeyEventResult.ignored;
    }
    return KeyEventResult.ignored;
  }

  @override
  void dispose() {
    _commentController.dispose();
    _commentFocusNode.dispose();
    _postBtnFocusNode.dispose();
    super.dispose();
  }

  Future<void> _loadComments() async {
    setState(() => _isLoadingComments = true);
    final comments = await _api.getChannelComments(widget.channel.uuid);
    if (mounted) {
      setState(() {
        _comments = comments;
        _isLoadingComments = false;
      });
    }
  }

  Future<void> _postComment() async {
    if (_commentController.text.trim().isEmpty) return;

    setState(() => _isPostingComment = true);
    
    final success = await _api.addChannelComment(
      widget.channel.uuid, 
      _commentController.text.trim()
    );

    if (mounted) {
      setState(() => _isPostingComment = false);
      if (success) {
        ToastService().show('Comment posted successfully', type: ToastType.success, context: context);
        _commentController.clear();
        _loadComments(); // Reload to show new comment
      } else {
        ToastService().show('Failed to post comment', type: ToastType.error, context: context);
      }
    }
  }

  String _formatDate(DateTime date) {
    return DateFormat('MMM d, y, h:mm a').format(date);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      insetPadding: const EdgeInsets.all(24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(
           maxWidth: 600,
           maxHeight: 500,
        ),
        child: Container(
          padding: const EdgeInsets.all(24),
          child: SingleChildScrollView( // Make entire modal scrollable
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    if (widget.channel.logoUrl != null)
                      Container(
                        width: 48,
                        height: 48,
                        margin: const EdgeInsets.only(right: 16),
                        decoration: BoxDecoration(
                          color: Colors.black26,
                          borderRadius: BorderRadius.circular(8),
                          image: DecorationImage(
                            image: NetworkImage(widget.channel.logoUrl!),
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.channel.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (widget.channel.category?.name != null)
                            Text(
                              widget.channel.category!.name,
                              style: const TextStyle(color: Colors.white60, fontSize: 14),
                            ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white60),
                      onPressed: () => Navigator.of(context).pop(),
                      tooltip: 'Close',
                    ),
                  ],
                ),
                

                
                // Comments Section Header
                const Text(
                  'Comments',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                
                // Post Comment / Login Prompt (Top)
                _buildPostCommentSection(),
                
                const SizedBox(height: 16),
                
                // Comments List
                _isLoadingComments
                    ? const Center(child: Padding(
                        padding: EdgeInsets.all(20.0),
                        child: CircularProgressIndicator(),
                      ))
                    : _comments.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.all(20.0),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.chat_bubble_outline, size: 48, color: Colors.white24),
                                  const SizedBox(height: 16),
                                  Text(
                                    widget.isLoggedIn 
                                        ? 'No comments yet. Be the first!' 
                                        : 'No comments yet.',
                                    style: const TextStyle(color: Colors.white38),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.separated(
                            shrinkWrap: true, // Allow it to shrink
                            physics: const NeverScrollableScrollPhysics(), // Scroll via parent
                            itemCount: _comments.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final comment = _comments[index];
                              return InkWell(
                                onFocusChange: (focused) {
                                  // Optional: Auto-scroll logic happens natively 
                                  // if widget is visible in SingleChildScrollView
                                },
                                borderRadius: BorderRadius.circular(8),
                                focusColor: Colors.white.withOpacity(0.1),
                                onTap: () {}, // Needed to make it focusable
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF334155),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.transparent), // Placeholder for potential border focus
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          CircleAvatar(
                                            radius: 10,
                                            backgroundColor: Colors.blueAccent,
                                            child: Text(
                                              comment.userName.isNotEmpty ? comment.userName[0].toUpperCase() : '?',
                                              style: const TextStyle(fontSize: 10, color: Colors.white),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            comment.userName,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          const Spacer(),
                                          Text(
                                            _formatDate(comment.createdAt),
                                            style: const TextStyle(color: Colors.white38, fontSize: 10),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        comment.comment,
                                        style: const TextStyle(color: Colors.white70, fontSize: 14),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                

              ],

            ),
          ),
        ),
      ),
    );
  }



  Widget _buildPostCommentSection() {
    if (DeviceUtils.isTV) {
       return const SizedBox.shrink(); // Hide input section completely on TV
    }
    if (!widget.isLoggedIn) {
      return _buildLoginPrompt('Login to post comments');
    }

    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _commentController,
            focusNode: _commentFocusNode,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Write a comment...',
              hintStyle: const TextStyle(color: Colors.white38),
              filled: true,
              fillColor: const Color(0xFF0F172A),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
            maxLines: 1, // Single line for TV input simplicity
            onSubmitted: (_) => _postComment(),
          ),
        ),
        const SizedBox(width: 12),
        ElevatedButton(
          focusNode: _postBtnFocusNode,
          onPressed: _isPostingComment ? null : _postComment,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.blueAccent,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: _isPostingComment
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Icon(Icons.send, color: Colors.white),
        ),
      ],
    );
  }

  Widget _buildLoginPrompt(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.blueAccent.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blueAccent.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: Colors.blueAccent, size: 20),
          const SizedBox(width: 12),
          Text(message, style: const TextStyle(color: Colors.white70)),
          const Spacer(),
          if (widget.onLoginRequested != null)
            TextButton(
              onPressed: widget.onLoginRequested,
              child: const Text('Login Now'),
            ),
        ],
      ),
    );
  }
}
