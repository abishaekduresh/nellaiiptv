import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/channel.dart';

class STBNavigationOverlay extends StatefulWidget {
  final Map<String, List<Channel>> groupedChannels;
  final Function(Channel) onChannelSelected;
  final VoidCallback onClose;
  final Channel? currentChannel;

  const STBNavigationOverlay({
    super.key,
    required this.groupedChannels,
    required this.onChannelSelected,
    required this.onClose,
    this.currentChannel,
  });

  @override
  State<STBNavigationOverlay> createState() => _STBNavigationOverlayState();
}

class _STBNavigationOverlayState extends State<STBNavigationOverlay> {
  String? _selectedCategory;
  late List<String> _categories;
  final FocusScopeNode _focusScopeNode = FocusScopeNode();

  @override
  void initState() {
    super.initState();
    // Maintain the order from the grouped map, but ensure "All Channels" is first if it exists
    final rawCategories = widget.groupedChannels.keys.toList();
    _categories = [];
    
    // Check for "All Channels" (case-insensitive)
    final allChannelsKey = rawCategories.firstWhere(
      (k) => k.toLowerCase() == "all channels",
      orElse: () => "",
    );

    if (allChannelsKey.isNotEmpty) {
      _categories.add(allChannelsKey);
      rawCategories.remove(allChannelsKey);
    }
    
    _categories.addAll(rawCategories);

    if (_categories.isNotEmpty) {
      // Try to find category of current channel
      if (widget.currentChannel != null) {
        for (var entry in widget.groupedChannels.entries) {
          if (entry.value.any((c) => c.uuid == widget.currentChannel!.uuid)) {
            _selectedCategory = entry.key;
            break;
          }
        }
      }
      _selectedCategory ??= _categories.first;
    }
  }

  @override
  void dispose() {
    _focusScopeNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FocusScope(
      node: _focusScopeNode,
      child: Stack(
        children: [
          // 1. Transparent Background Layer - Handles "Tap to Close"
          Positioned.fill(
            child: GestureDetector(
              onTap: widget.onClose,
              behavior: HitTestBehavior.opaque,
              child: Container(color: Colors.transparent),
            ),
          ),

          // 2. Sidebar Navigation Panel
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: MediaQuery.of(context).size.width * 0.45,
            child: GestureDetector(
              onTap: () {}, // Prevent taps from reaching the closing background
              behavior: HitTestBehavior.opaque,
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A).withOpacity(0.85),
                  border: const Border(right: BorderSide(color: Colors.white10, width: 1)),
                ),
                child: ClipRRect(
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Row(
                      children: [
                        // Categories Sidebar
                        Expanded(
                          flex: 2,
                          child: Container(
                            decoration: const BoxDecoration(
                              border: Border(right: BorderSide(color: Colors.white10)),
                            ),
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              itemCount: _categories.length,
                              itemBuilder: (context, index) {
                                final category = _categories[index];
                                final isSelected = _selectedCategory == category;
                                
                                return _buildMenuItem(
                                  label: category.toUpperCase(),
                                  isSelected: isSelected,
                                  onSelect: () => setState(() => _selectedCategory = category),
                                );
                              },
                            ),
                          ),
                        ),
                        // Channels List
                        Expanded(
                          flex: 3,
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(vertical: 20),
                            itemCount: widget.groupedChannels[_selectedCategory]?.length ?? 0,
                            itemBuilder: (context, index) {
                              final channel = widget.groupedChannels[_selectedCategory]![index];
                              final isCurrent = widget.currentChannel?.uuid == channel.uuid;

                              return _buildChannelItem(
                                channel: channel,
                                isCurrent: isCurrent,
                                onTap: () => widget.onChannelSelected(channel),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ).animate().slideX(begin: -1.0, end: 0.0),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required String label,
    required bool isSelected,
    required VoidCallback onSelect,
  }) {
    return Focus(
      autofocus: isSelected,
      onFocusChange: (focused) {
        if (focused) onSelect();
      },
      child: Builder(
        builder: (context) {
          final isFocused = Focus.of(context).hasFocus;
          return InkWell(
            onTap: onSelect,
            borderRadius: BorderRadius.circular(8),
            child: AnimatedContainer(
              duration: 200.ms,
              margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
              decoration: BoxDecoration(
                color: isFocused ? const Color(0xFF0EA5E9) : (isSelected ? const Color(0xFF1E293B) : Colors.transparent),
                borderRadius: BorderRadius.circular(8),
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
            ),
          );
        },
      ),
    );
  }

  Widget _buildChannelItem({
    required Channel channel,
    required bool isCurrent,
    required VoidCallback onTap,
  }) {
    return Focus(
      child: Builder(
        builder: (context) {
          final isFocused = Focus.of(context).hasFocus;
          return AnimatedContainer(
            duration: 200.ms,
            margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isFocused ? const Color(0xFF0EA5E9).withOpacity(0.2) : Colors.transparent,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isFocused ? const Color(0xFF0EA5E9) : (isCurrent ? Colors.white24 : Colors.transparent),
                width: 1,
              ),
            ),
            child: ListTile(
              onTap: onTap,
              dense: true,
              leading: Container(
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
              title: Text(
                channel.name,
                style: TextStyle(
                  color: isCurrent ? const Color(0xFF0EA5E9) : Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              subtitle: Text(
                "CH ${channel.channelNumber ?? '-'}",
                style: const TextStyle(color: Colors.white38, fontSize: 11),
              ),
              trailing: isCurrent ? const Icon(Icons.play_circle_fill, color: Color(0xFF0EA5E9), size: 18) : null,
            ),
          );
        },
      ),
    );
  }
}
