import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/channel_provider.dart';
import '../../models/channel.dart';
import '../../models/ad.dart';
import '../../core/api_service.dart';
import 'embedded_player.dart';

class ClassicScreen extends StatefulWidget {
  const ClassicScreen({super.key});

  @override
  State<ClassicScreen> createState() => _ClassicScreenState();
}

class _ClassicScreenState extends State<ClassicScreen> {
  Channel? _selectedChannel;
  final ApiService _api = ApiService();
  
  // Ad State
  List<Ad> _ads = [];
  int _currentAdIndex = 0;
  Timer? _adTimer;
  
  // Group By State
  String _groupBy = 'Categories'; // 'Categories' or 'Languages' or 'All'
  
  // Fullscreen State
  bool _isFullScreen = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    await context.read<ChannelProvider>().fetchChannels();
    final channels = context.read<ChannelProvider>().channels;
    if (channels.isNotEmpty && mounted) {
      setState(() {
        _selectedChannel = channels.first;
      });
    }
    _loadAds();
  }

  Future<void> _loadAds() async {
    final ads = await _api.getAds();
    if (mounted && ads.isNotEmpty) {
      setState(() {
        _ads = ads;
      });
      _startAdRotation();
    }
  }

  void _startAdRotation() {
    _adTimer?.cancel();
    if (_ads.isEmpty) return;
    
    final currentAd = _ads[_currentAdIndex];
    // Record initial impression
    _api.recordAdImpression(currentAd.uuid);

    // Rotate after runTimeSeconds
    _adTimer = Timer(Duration(seconds: currentAd.runTimeSeconds), () {
      if (mounted) {
        setState(() {
          _currentAdIndex = (_currentAdIndex + 1) % _ads.length;
        });
        _startAdRotation(); // Recursive call for next ad
      }
    });
  }

  @override
  void dispose() {
    _adTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Row(
        children: [
          // Left Panel (Player + Info + Ads)
          Expanded(
            flex: 6,
            child: Column(
              children: [
                // Player Area - Maximized (Flex 6 normally, or expanded if fullscreen)
                Expanded(
                  child: Container(
                    color: Colors.black,
                    child: _selectedChannel != null 
                    ? EmbeddedPlayer(
                        channelUuid: _selectedChannel!.uuid, 
                        key: ValueKey(_selectedChannel!.uuid),
                        onDoubleTap: () => setState(() => _isFullScreen = !_isFullScreen),
                      )
                    : const Center(child: CircularProgressIndicator()),
                  ),
                ),
                
                // Channel Info - Styled Banner
                if (!_isFullScreen)
                  Container(
                  height: 60,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                  color: const Color(0xFF0F172A), // Darker slate to match header
                  child: _selectedChannel != null ? Row(
                    children: [
                      // Left Side: Name & Metadata
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Row 1: Badge + Name
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF06B6D4),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    "CH ${_selectedChannel!.channelNumber?.toString() ?? '-'}", 
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _selectedChannel!.name.toUpperCase(),
                                    style: const TextStyle(
                                      color: Colors.white, 
                                      fontSize: 16, 
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5
                                    ),
                                    maxLines: 1, 
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            // Row 2: Metadata (Language | Location)
                            Row(
                              children: [
                                // Language
                                Container(
                                  width: 6, height: 6,
                                  decoration: const BoxDecoration(color: Color(0xFF10B981), shape: BoxShape.circle),
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  _selectedChannel!.language?.name ?? 'Unknown',
                                  style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.w500),
                                ),
                                
                                // Location (Only show if available)
                                if (_selectedChannel!.location.isNotEmpty) ...[
                                  const SizedBox(width: 8),
                                  Container(width: 1, height: 10, color: Colors.white24),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.location_on, size: 12, color: Colors.grey),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      _selectedChannel!.location, 
                                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(width: 4),

                      // Right Side: Stats Box
                        Container(
                        margin: const EdgeInsets.fromLTRB(12, 12, 8, 12),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                            color: const Color(0xFF1E293B),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.white10),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Viewers
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.remove_red_eye, color: Color(0xFF10B981), size: 12),
                                const SizedBox(height: 1),
                                Text(
                                  _selectedChannel!.viewersCountFormatted ?? '0', 
                                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)
                                ),
                                const Text("VIEWS", style: TextStyle(color: Colors.white38, fontSize: 7)),
                              ],
                            ),
                            const SizedBox(width: 10),
                            Container(width: 1, height: 16, color: Colors.white10),
                            const SizedBox(width: 10),
                            // Rating
                            Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.star, color: Colors.amber, size: 12),
                                const SizedBox(height: 1),
                                Text(
                                  _selectedChannel!.averageRating?.toString() ?? '-', 
                                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)
                                ),
                                const Text("RATING", style: TextStyle(color: Colors.white38, fontSize: 7)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ) : const SizedBox(),
                ),
                
                // Ad Banner
                if (_ads.isNotEmpty && !_isFullScreen)
                  Container(
                    height: 100,
                    width: double.infinity,
                    color: Colors.black,
                     child: Image.network(
                       _ads[_currentAdIndex].imageUrl,
                       fit: BoxFit.cover,
                       errorBuilder: (_,__,___) => const SizedBox(), 
                     ).animate(key: ValueKey(_currentAdIndex)).fadeIn(),
                  )
                else if (!_isFullScreen) // Show "No Ads" only if not full screen
                  const SizedBox(height: 100, child: Center(child: Text("No Ads", style: TextStyle(color: Colors.white10)))),
              ],
            ),
          ),

          // Right Panel (Grid + Filters)
          if (!_isFullScreen)
          Expanded(
            flex: 4,
            child: Column(
              children: [
                   Consumer<ChannelProvider>(
                     builder: (context, provider, _) {
                       // Determine title based on selection
                       String title = "All Channels";
                       if (provider.selectedCategory != null) title = provider.selectedCategory!.name;
                       if (provider.selectedLanguage != null) title = provider.selectedLanguage!.name;

                       return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: const BoxDecoration(
                          border: Border(bottom: BorderSide(color: Colors.white10)),
                        ),
                        child: Column(
                           crossAxisAlignment: CrossAxisAlignment.start,
                           children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    title, 
                                    style: const TextStyle(color: Color(0xFF0EA5E9), fontWeight: FontWeight.bold, fontSize: 16)
                                  ),
                                  // Toggle Button to switch Group Mode (Categories / Languages)
                                   GestureDetector(
                                      onTap: () {
                                         setState(() {
                                            _groupBy = _groupBy == 'Categories' ? 'Languages' : 'Categories';
                                            provider.selectCategory(null); // Reset filters
                                         });
                                      },
                                     child: Container(
                                       height: 30,
                                       padding: const EdgeInsets.symmetric(horizontal: 12),
                                       decoration: BoxDecoration(
                                          color: const Color(0xFF1E293B),
                                          border: Border.all(color: Colors.white24), 
                                          borderRadius: BorderRadius.circular(4)
                                       ),
                                       alignment: Alignment.center,
                                       child: Row(
                                          children: [
                                             Text(
                                                "Group by: $_groupBy",
                                                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                             ),
                                             const SizedBox(width: 4),
                                             const Icon(Icons.swap_horiz, color: Colors.white54, size: 16),
                                          ],
                                       ),
                                     ),
                                   ),
                                ],
                              ),
                             const SizedBox(height: 12),
                             
                             // Horizontal Filter List
                             SizedBox(
                               height: 32,
                               child: ListView.separated(
                                 scrollDirection: Axis.horizontal,
                                 itemCount: _groupBy == 'Categories' 
                                     ? provider.categories.length + 1 
                                     : provider.languages.length + 1,
                                 separatorBuilder: (_,__) => const SizedBox(width: 8),
                                 itemBuilder: (context, index) {
                                   if (index == 0) {
                                      return _buildCategoryChip(
                                        "All", 
                                        provider.selectedCategory == null && provider.selectedLanguage == null, 
                                        () => provider.selectCategory(null)
                                      );
                                   }
                                   
                                   if (_groupBy == 'Categories') {
                                      final cat = provider.categories[index - 1];
                                      return _buildCategoryChip(
                                        cat.name, 
                                        provider.selectedCategory == cat, 
                                        () => provider.selectCategory(cat)
                                      );
                                   } else {
                                      final lang = provider.languages[index - 1];
                                      return _buildCategoryChip(
                                        lang.name, 
                                        provider.selectedLanguage == lang, 
                                        () => provider.selectLanguage(lang)
                                      );
                                   }
                                 },
                               ),
                             )
                           ],
                        ),
                      );
                     },
                   ),

                   // Channel Grid
                   Expanded(
                     child: Consumer<ChannelProvider>(
                        builder: (context, provider, _) {
                          final channels = provider.filteredChannels;
                          return GridView.builder(
                            padding: const EdgeInsets.all(12),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 3, 
                              childAspectRatio: 1.1,
                              crossAxisSpacing: 10,
                              mainAxisSpacing: 10,
                            ),
                            itemCount: channels.length,
                            itemBuilder: (context, index) {
                              final channel = channels[index];
                              final isSelected = _selectedChannel?.uuid == channel.uuid;
                              
                              // Use thumbnail if available, else logo
                              final String? displayImage = channel.thumbnailUrl != null && channel.thumbnailUrl!.isNotEmpty 
                                  ? channel.thumbnailUrl 
                                  : channel.logoUrl;

                              return GestureDetector(
                                onTap: () => setState(() => _selectedChannel = channel),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  curve: Curves.easeOut,
                                  transform: isSelected ? Matrix4.identity().scaled(1.05) : Matrix4.identity(),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF1E293B),
                                    borderRadius: BorderRadius.circular(8),
                                    border: isSelected ? Border.all(color: const Color(0xFF0EA5E9), width: 2) : Border.all(color: Colors.transparent, width: 2),
                                    boxShadow: isSelected ? [
                                      BoxShadow(color: const Color(0xFF0EA5E9).withOpacity(0.4), blurRadius: 12, spreadRadius: 1)
                                    ] : [],
                                  ),
                                  child: Stack(
                                    children: [
                                      Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          if (displayImage != null)
                                            Expanded(
                                              child: Center(
                                                child: Padding(
                                                  padding: const EdgeInsets.all(8.0),
                                                  child: Image.network(
                                                    displayImage, 
                                                    fit: BoxFit.contain, 
                                                    alignment: Alignment.center,
                                                    errorBuilder: (_,__,___) => const Icon(Icons.tv, color: Colors.white24)
                                                  ),
                                                ),
                                              ),
                                            ),
                                          Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
                                            child: Text(
                                              channel.name, 
                                              style: TextStyle(
                                                color: isSelected ? const Color(0xFF0EA5E9) : Colors.white, 
                                                fontSize: 11, 
                                                fontWeight: FontWeight.bold
                                              ), 
                                              textAlign: TextAlign.center, 
                                              maxLines: 1,
                                            ),
                                          ),
                                        ],
                                      ),
                                      // Channel Number
                                       Positioned(
                                        top: 6,
                                        right: 6,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: Colors.black.withOpacity(0.6),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            "CH-${channel.channelNumber ?? '-'}",
                                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ).animate().fadeIn(duration: 400.ms).scale(delay: (30 * (index % 20)).ms);
                            },
                          );
                        },
                     ),
                   ),
                ],
              ),
            ),
          ],
        ),
      );
  }

  Widget _buildCategoryChip(String label, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0), 
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF0EA5E9) : const Color(0xFF334155),
          borderRadius: BorderRadius.circular(4),
          border: isSelected ? null : Border.all(color: Colors.white10),
        ),
        child: Text(
          label, 
          style: TextStyle(
            color: Colors.white, 
            fontSize: 12, 
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal
          )
        ),
      ),
    );
  }

  Widget _buildBadge(String text, {Color color = const Color(0xFF334155)}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}
