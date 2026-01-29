import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/channel.dart';

/// STBNavigationOverlay
/// 
/// This widget provides an overlay navigation menu for Set-Top Box (STB) interactions.
/// It displays a sidebar with categories and a list of channels for the selected category.
/// 
/// Key Features:
/// - **Two-Pane Layout**: Categories on the left, Channels on the right.
/// - **TV Remote Support**: Handles focus traversal and selection events.
/// - **Auto-Hide**: Automatically closes the overlay after inactivity (5 seconds).
/// - **Animations**: Smooth slide-in/out animations using `AnimationController`.
/// - **Performance**: Uses basic opacity instead of blur for better performance on low-end devices.

class STBNavigationOverlay extends StatefulWidget {
  final Map<String, List<Channel>> groupedChannels; // Data source: key=Category Name, value=List of Channels
  final Function(Channel) onChannelSelected; // Callback when a channel is selected
  final VoidCallback onClose; // Callback to close the overlay manually
  final Channel? currentChannel; // Currently playing channel to highlight
  final String? initialCategory; // Ensure we can resume from last selected category
  final ValueChanged<String>? onCategoryChanged; // Notify parent of category changes

  const STBNavigationOverlay({
    super.key,
    required this.groupedChannels,
    required this.onChannelSelected,
    required this.onClose,
    this.currentChannel,
    this.initialCategory,
    this.onCategoryChanged,
  });

  @override
  State<STBNavigationOverlay> createState() => _STBNavigationOverlayState();
}

class _STBNavigationOverlayState extends State<STBNavigationOverlay> with SingleTickerProviderStateMixin {
  String? _selectedCategory; // Tracks the currently selected category in the sidebar
  late List<String> _categories; // List of category names for sidebar
  final FocusScopeNode _focusScopeNode = FocusScopeNode(); // Manages focus for TV remote navigation
  Timer? _autoHideTimer; // Timer to auto-close the overlay when inactive
  late AnimationController _animationController; // Controls the entrance/exit animation
  final ScrollController _channelScrollController = ScrollController(); // To scroll to current channel


  // -- Animation Handlers --

  /// Reverses the animation and calls the close callback upon completion.
  void _handleClose() {
    _animationController.reverse().then((_) {
       if (mounted) widget.onClose();
    });
  }

  /// Reverses the animation and triggers channel selection upon completion.
  void _handleChannelSelect(Channel channel) {
    _animationController.reverse().then((_) {
       if (mounted) widget.onChannelSelected(channel);
    });
  }

  // -- Timer Logic --

  /// Resets the auto-hide timer. Called on user activity (tap, scroll, hover, key press).
  void _resetAutoHideTimer() {
    _autoHideTimer?.cancel();
    _autoHideTimer = Timer(const Duration(seconds: 5), () {
      if (mounted) {
        _handleClose();
      }
    });
  }

  @override
  void initState() {
    super.initState();
    // Initialize Animation Controller
    _animationController = AnimationController(vsync: this, duration: 300.ms);
    _animationController.forward();

    // -- Category Initialization --
    // Maintain the order from the grouped map, but ensure "All Channels" is first if it exists.
    final rawCategories = widget.groupedChannels.keys.toList();
    _categories = [];
    
    // Check for "All Channels" (case-insensitive) to prioritize it
    final allChannelsKey = rawCategories.firstWhere(
      (k) => k.toLowerCase() == "all channels",
      orElse: () => "",
    );

    if (allChannelsKey.isNotEmpty) {
      _categories.add(allChannelsKey);
      rawCategories.remove(allChannelsKey);
    }
    
    _categories.addAll(rawCategories);

    // Set initial category selection logic
    if (_categories.isNotEmpty) {
      // 1. Prioritize explicitly passed initial category (Persistence)
      if (widget.initialCategory != null && _categories.contains(widget.initialCategory)) {
        _selectedCategory = widget.initialCategory;
      } 
      // 2. Fallback to Current Channel's Category
      else if (widget.currentChannel != null) {
        // Try to find the specific category first, avoiding "All Channels" to reduce noise
        for (var entry in widget.groupedChannels.entries) {
          if (entry.key == "All Channels") continue; // Skip generic group
          if (entry.value.any((c) => c.uuid == widget.currentChannel!.uuid)) {
            _selectedCategory = entry.key;
            break;
          }
        }
        // If not found in specific categories, query all (e.g. if it's only in All Channels)
        if (_selectedCategory == null) {
          for (var entry in widget.groupedChannels.entries) {
             if (entry.value.any((c) => c.uuid == widget.currentChannel!.uuid)) {
               _selectedCategory = entry.key;
               break;
             }
          }
        }
      }
      // 3. Absolute Fallback
      _selectedCategory ??= _categories.first;
      
      // Notify parent of the initial resolved category
      if (_selectedCategory != null) {
         // Defer execution to avoid setState during build if parent reacts synchronously
         WidgetsBinding.instance.addPostFrameCallback((_) {
            widget.onCategoryChanged?.call(_selectedCategory!);
         });
      }
    }
    
    // Start the auto-hide timer immediately
    _resetAutoHideTimer();

    // Scroll to current channel after build
    WidgetsBinding.instance.addPostFrameCallback((_) {
       _scrollToCurrentChannel();
    });
  }

  void _scrollToCurrentChannel() {
    if (_selectedCategory == null || widget.currentChannel == null) return;
    
    final channels = widget.groupedChannels[_selectedCategory];
    if (channels == null) return;

    final index = channels.indexWhere((c) => c.uuid == widget.currentChannel!.uuid);
    if (index != -1) {
       // Estimate Item Height: 
       // ListTile with Dense=true (~48-56 depending on texture) + Vertical Margin (8)
       // Let's assume ~68.0 pixels per item to be safe.
       final double itemHeight = 65.0; 
       final double offset = index * itemHeight;

       // Center selection if possible, or just scroll to top
       // For simple list jump:
       if (_channelScrollController.hasClients) {
          // Calculate valid scroll extent
          final maxScroll = _channelScrollController.position.maxScrollExtent;
          final target = offset > maxScroll ? maxScroll : offset;
          _channelScrollController.jumpTo(target);
       }
    }
  }

  @override
  void dispose() {
    _autoHideTimer?.cancel();
    _animationController.dispose();
    _focusScopeNode.dispose();
    _channelScrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // FocusScope captures interactions for TV navigation
    return FocusScope(
      node: _focusScopeNode,
      child: Stack(
        children: [
          // 1. Transparent Background Layer - Handles "Tap Outside to Close"
          Positioned.fill(
            child: GestureDetector(
              onTap: _handleClose,
              behavior: HitTestBehavior.opaque,
              child: Container(color: Colors.transparent),
            ),
          ),

          // 2. Sidebar Navigation Panel (The main overlay content)
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: MediaQuery.of(context).size.width * 0.45, // Occupies 45% of screen width
            child: Listener(
              // Listen for pointer events to reset auto-hide timer
              onPointerDown: (_) => _resetAutoHideTimer(),
              onPointerHover: (_) => _resetAutoHideTimer(),
              child: GestureDetector(
                onTap: () { _resetAutoHideTimer(); }, // Prevent taps on menu from closing it
                behavior: HitTestBehavior.opaque,
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A).withOpacity(0.90), // Increased Opacity for better contrast
                    border: const Border(right: BorderSide(color: Colors.white10, width: 1)),
                  ),
                  child: Row(
                    children: [
                      // -- Left Pane: Category List --
                      Expanded(
                        flex: 2,
                        child: Container(
                          decoration: const BoxDecoration(
                            border: Border(right: BorderSide(color: Colors.white10)),
                          ),
                          child: NotificationListener<ScrollNotification>(
                            onNotification: (_) { _resetAutoHideTimer(); return false; }, // Reset timer on scroll
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              itemCount: _categories.length,
                              itemBuilder: (context, index) {
                                final category = _categories[index];
                                final isSelected = _selectedCategory == category;
                                
                                return _buildMenuItem(
                                  label: category.toUpperCase(),
                                  isSelected: isSelected,
                                  onSelect: () {
                                    setState(() => _selectedCategory = category);
                                    widget.onCategoryChanged?.call(category);
                                  },
                                );
                              },
                            ),
                          ),
                        ),
                      ),

                      // -- Right Pane: Channel List --
                      Expanded(
                        flex: 3,
                        child: NotificationListener<ScrollNotification>(
                          onNotification: (_) { _resetAutoHideTimer(); return false; }, // Reset timer on scroll
                          child: ListView.builder(
                            controller: _channelScrollController,
                            padding: const EdgeInsets.symmetric(vertical: 20),
                            itemCount: widget.groupedChannels[_selectedCategory]?.length ?? 0,
                            itemBuilder: (context, index) {
                              final channel = widget.groupedChannels[_selectedCategory]![index];
                              final isCurrent = widget.currentChannel?.uuid == channel.uuid;

                              return _buildChannelItem(
                                channel: channel,
                                isCurrent: isCurrent,
                                onTap: () => _handleChannelSelect(channel),
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ).animate(controller: _animationController, autoPlay: false).slideX(begin: -1.0, end: 0.0), // Slide-in Animation
            ),
          ),
        ],
      ),
    );
  }

  /// Builds a single category menu item in the left sidebar.
  Widget _buildMenuItem({
    required String label,
    required bool isSelected,
    required VoidCallback onSelect,
  }) {
    return Builder(
      builder: (context) {
        final focusNode = FocusNode();
        if (isSelected && !focusNode.hasFocus && !focusNode.hasPrimaryFocus) {
           // We can't easily auto-request focus here without a loop, 
           // but we can rely on the parent or initial focus request.
        }

        return InkWell(
          focusNode: focusNode,
          onTap: onSelect,
          autofocus: isSelected, // Try to grab focus if selected
          onFocusChange: (focused) {
            if (focused) {
              onSelect();
              _resetAutoHideTimer();
            }
          },
          borderRadius: BorderRadius.circular(8),
          child: AnimatedBuilder(
            animation: focusNode,
            builder: (context, child) {
              final isFocused = focusNode.hasFocus;
              return AnimatedContainer(
                duration: 200.ms,
                margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
                decoration: BoxDecoration(
                  // Highlight if focused or selected
                  color: isFocused ? const Color(0xFF0EA5E9) : (isSelected ? const Color(0xFF1E293B) : Colors.transparent),
                  borderRadius: BorderRadius.circular(8),
                  border: isFocused ? Border.all(color: Colors.white, width: 2) : Border.all(color: Colors.transparent, width: 2),
                  boxShadow: isFocused ? [
                    BoxShadow(color: const Color(0xFF0EA5E9).withOpacity(0.5), blurRadius: 8, spreadRadius: 1)
                  ] : [],
                ),
                child: Text(
                  label,
                  style: TextStyle(
                    color: isFocused ? Colors.white : (isSelected ? const Color(0xFF0EA5E9) : Colors.white60),
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    letterSpacing: 0.5,
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  /// Builds a single channel list item in the right pane.
  Widget _buildChannelItem({
    required Channel channel,
    required bool isCurrent,
    required VoidCallback onTap,
  }) {
    return Builder(
      builder: (context) {
        final focusNode = FocusNode();
        return InkWell(
          focusNode: focusNode,
          onTap: onTap,
          onFocusChange: (focused) {
            if (focused) _resetAutoHideTimer();
          },
          borderRadius: BorderRadius.circular(8),
          child: AnimatedBuilder(
            animation: focusNode,
            builder: (context, child) {
              final isFocused = focusNode.hasFocus;
              return AnimatedContainer(
                duration: 200.ms,
                margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  // Slight background highlight on focus
                  color: isFocused ? const Color(0xFF0EA5E9).withOpacity(0.2) : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  // Border highlight on focus or if currently playing
                  border: Border.all(
                    color: isFocused ? const Color(0xFF0EA5E9) : (isCurrent ? Colors.white24 : Colors.transparent),
                    width: isFocused ? 2 : 1,
                  ),
                  boxShadow: isFocused ? [
                     BoxShadow(color: const Color(0xFF0EA5E9).withOpacity(0.3), blurRadius: 4)
                  ] : [],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white10,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: CachedNetworkImage(
                          imageUrl: channel.logoUrl ?? '',
                          fit: BoxFit.contain,
                          errorWidget: (_, __, ___) => const Icon(Icons.tv, color: Colors.white24, size: 20),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            channel.name,
                            style: TextStyle(
                              color: isCurrent ? const Color(0xFF0EA5E9) : Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            "CH ${channel.channelNumber ?? '-'}",
                            style: const TextStyle(color: Colors.white38, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    if (isCurrent)
                      const Icon(Icons.play_circle_fill, color: Color(0xFF0EA5E9), size: 18),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}
