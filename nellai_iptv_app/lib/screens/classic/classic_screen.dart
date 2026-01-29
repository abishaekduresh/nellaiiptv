import 'dart:async';
import 'dart:io'; // Import for exit(0)
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/channel_provider.dart';
import '../../models/channel.dart';
import '../../models/ad.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../core/api_service.dart';
import '../../models/public_settings.dart';
import 'embedded_player.dart';
import 'stb_navigation_overlay.dart';

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
  bool _isLoadingAds = true;
  int _currentAdIndex = 0;
  Timer? _adTimer;
  
  // Group By State
  String _groupBy = 'Categories'; // 'Categories' or 'Languages' or 'All'
  
  // Fullscreen State
  bool _isFullScreen = false;
  bool _showChannelOverlay = false;
  
  // STB Persisted State
  String? _lastStbCategory; // Remembers the last browsed category in STB Menu
  
  // Settings
  PublicSettings? _settings;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    // Fetch Settings
    _api.getPublicSettings().then((settings) {
       if (mounted && settings != null) {
          setState(() {
             _settings = settings;
          });
       }
    });

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
    setState(() => _isLoadingAds = true);
    final ads = await _api.getAds();
    if (mounted && ads.isNotEmpty) {
      setState(() {
        _ads = ads;
        _isLoadingAds = false;
      });
      _startAdRotation();
    } else {
      setState(() => _isLoadingAds = false);
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
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        if (_showChannelOverlay) {
          setState(() => _showChannelOverlay = false);
          return;
        }
        final bool shouldExit = await _showExitConfirmation();
        if (shouldExit) {
          if (context.mounted) {
             exit(0);
          }
        }
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0F172A),
      body: Consumer<ChannelProvider>(
        builder: (context, provider, child) {
          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.redAccent, size: 60),
                  const SizedBox(height: 16),
                  Text(
                    "Error Loading Content",
                    style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      provider.error!,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white70, fontSize: 16),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => provider.fetchChannels(),
                    icon: const Icon(Icons.refresh),
                    label: const Text("Retry"),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                  )
                ],
              ),
            );
          }
          
          return Row(
            children: [
              // Left Panel (Player + Info + Ads)
          Expanded(
            flex: 5,
            child: Column(
              children: [
                // Player Area - Maximized (Flex 6 normally, or expanded if fullscreen)
                Expanded(
                  child: Container(
                    color: Colors.black,
                    child: Stack(
                      children: [
                        _selectedChannel != null 
                        ? EmbeddedPlayer(
                            channelUuid: _selectedChannel!.uuid, 
                            initialChannel: _selectedChannel,
                            key: ValueKey(_selectedChannel!.uuid),
                            isFullScreen: _isFullScreen,
                            hideControls: _showChannelOverlay,
                            onDoubleTap: () => setState(() => _isFullScreen = !_isFullScreen),
                            onTap: () {
                              if (_isFullScreen) {
                                setState(() => _showChannelOverlay = !_showChannelOverlay);
                              }
                            },
                            onChannelLoaded: (updatedChannel) {
                               // Update local state to show ratings/views which weren't in the list API
                               if (mounted && _selectedChannel?.uuid == updatedChannel.uuid) {
                                  setState(() {
                                    _selectedChannel = updatedChannel;
                                  });
                               }
                            },
                          )
                        : const Center(child: CircularProgressIndicator()),
                        
                        // Set-top Box Navigation Overlay
                        if (_isFullScreen && _showChannelOverlay)
                           STBNavigationOverlay(
                              key: const ValueKey('stb_overlay'),
                              groupedChannels: _getGroupedChannels(provider),
                              currentChannel: _selectedChannel,
                              initialCategory: _lastStbCategory,
                              onCategoryChanged: (newCategory) {
                                 _lastStbCategory = newCategory;
                              },
                              onClose: () => setState(() => _showChannelOverlay = false),
                              onChannelSelected: (channel) {
                                setState(() {
                                  _selectedChannel = channel;
                                  _showChannelOverlay = false; // Auto close on select
                                });
                              },
                           ),
                      ],
                    ),
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
                      // Right Side: Stats Box (REMOVED)

                    ],
                  ) : const SizedBox(),
                ),
                
                // Ad Banner - Shown if ads exist OR if loading
                if (!_isFullScreen)
                  _isLoadingAds 
                    ? const SkeletonAdBanner()
                    : _ads.isNotEmpty 
                        ? Material(
                            color: Colors.black,
                            child: InkWell(
                              onTap: () async {
                                 final url = _ads[_currentAdIndex].linkUrl;
                                 if (url != null && url.isNotEmpty) {
                                     final uri = Uri.parse(url);
                                     if (await canLaunchUrl(uri)) {
                                         await launchUrl(uri, mode: LaunchMode.externalApplication);
                                     }
                                 }
                              },
                              focusColor: const Color(0xFF06B6D4).withOpacity(0.4), // Cyan highlight on focus
                              splashColor: const Color(0xFF06B6D4).withOpacity(0.2),
                              child: SizedBox(
                                height: 100,
                                width: double.infinity,
                                child: CachedNetworkImage(
                                  imageUrl: _ads[_currentAdIndex].imageUrl,
                                  fit: BoxFit.fill,
                                  placeholder: (context, url) => const SkeletonAdBanner(),
                                  errorWidget: (context, url, error) => const SizedBox(), 
                                ),
                              ),
                            ),
                          ).animate(key: ValueKey(_currentAdIndex)).fadeIn()
                        : const SizedBox(),
              ],
            ),
          ),

          // Right Panel (Grid + Filters)
          if (!_isFullScreen)
          Expanded(
            flex: 5,
            child: Column(
              children: [
                   Consumer<ChannelProvider>(
                     builder: (context, provider, _) {
                       // Always Show Logo and App Name layout
                       Widget titleWidget = Row(
                             children: [
                               if (_settings != null && _settings!.logoUrl != null && _settings!.logoUrl!.isNotEmpty)
                                 Padding(
                                   padding: const EdgeInsets.only(right: 12.0),
                                   child: ClipRRect(
                                     borderRadius: BorderRadius.circular(8),
                                     child: Image.network(
                                       _settings!.logoUrl!,
                                       height: 48, 
                                       width: 48,
                                       fit: BoxFit.cover,
                                       errorBuilder: (_,__,___) => const SizedBox(),
                                     ),
                                   ),
                                 ),
                               Column(
                                 crossAxisAlignment: CrossAxisAlignment.start,
                                 children: [
                                   Text(
                                     _settings?.appName ?? dotenv.env['APP_TITLE'] ?? "Nellai IPTV",
                                     style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)
                                   ),
                                   const Text(
                                     "CLASSIC MODE",
                                     style: TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.0)
                                   ),
                                 ],
                               ),
                             ],
                           );

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
                                   titleWidget,
                                   Row(
                                     children: [
                                       // Refresh Button
                                       Builder(
                                         builder: (context) {
                                           final refreshFocus = FocusNode();
                                           return InkWell(
                                             focusNode: refreshFocus,
                                             onTap: () => provider.fetchChannels(),
                                             borderRadius: BorderRadius.circular(4),
                                             child: AnimatedBuilder(
                                               animation: refreshFocus,
                                               builder: (context, _) {
                                                 return Container(
                                                   height: 30,
                                                   width: 30, // Square button
                                                   decoration: BoxDecoration(
                                                     color: refreshFocus.hasFocus ? const Color(0xFF0EA5E9) : const Color(0xFF1E293B),
                                                     border: Border.all(color: Colors.white24),
                                                     borderRadius: BorderRadius.circular(4),
                                                   ),
                                                   child: Icon(
                                                     Icons.refresh,
                                                     size: 18,
                                                     color: refreshFocus.hasFocus ? Colors.white : Colors.white70,
                                                   ),
                                                 );
                                               },
                                             ),
                                           );
                                         }
                                       ),
                                       const SizedBox(width: 8),
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
                          // SKELETON LOADING
                          if (provider.isLoading) {
                             return GridView.builder(
                               padding: const EdgeInsets.all(12),
                               gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                 crossAxisCount: 3, 
                                 childAspectRatio: 1.1,
                                 crossAxisSpacing: 10,
                                 mainAxisSpacing: 10,
                               ),
                               itemCount: 12, // Show 12 skeletons
                               itemBuilder: (context, index) => const SkeletonChannelCard(),
                             );
                          }

                          final channels = provider.filteredChannels;
                          final int itemsPerRow = 3;
                          final int rowCount = (channels.length / itemsPerRow).ceil();

                          return ListView.separated(
                            padding: const EdgeInsets.all(12),
                            itemCount: rowCount,
                            separatorBuilder: (context, index) {
                               // Insert Ad every 5 rows (indexes 0-4 are the first 5 rows, so after index 4 (5th row) we show ad)
                               if ((index + 1) % 5 == 0 && _ads.isNotEmpty) {
                                  final adIndex = ((index + 1) ~/ 5) % _ads.length;
                                  return Container(
                                    margin: const EdgeInsets.symmetric(vertical: 10),
                                    height: 100,
                                    width: double.infinity,
                                    color: Colors.black,
                                    child: CachedNetworkImage(
                                       imageUrl: _ads[adIndex].imageUrl,
                                       fit: BoxFit.fill,
                                       placeholder: (context, url) => const SkeletonAdBanner(),
                                       errorWidget: (context, url, error) => const SizedBox(), 
                                    ),
                                  );
                               }
                               return const SizedBox(height: 10);
                            },
                            itemBuilder: (context, rowIndex) {
                               final int startIndex = rowIndex * itemsPerRow;
                               final int endIndex = (startIndex + itemsPerRow < channels.length) 
                                   ? startIndex + itemsPerRow 
                                   : channels.length;
                               final rowChannels = channels.sublist(startIndex, endIndex);

                               return Row(
                                 children: [
                                   for (int i = 0; i < itemsPerRow; i++)
                                     Expanded(
                                       child: (i < rowChannels.length) 
                                         ? Padding(
                                             // Add spacing: Right padding for all except last item
                                             padding: EdgeInsets.only(right: (i < itemsPerRow - 1) ? 10.0 : 0),
                                             child: AspectRatio(
                                               aspectRatio: 1.1,
                                               child: _buildChannelCard(rowChannels[i]),
                                             ),
                                           )
                                         : const SizedBox(), // Spacer for unfilled rows
                                     ),
                                 ],
                               );
                            },
                          );
                        },
                     ),
                   ),
                ],
              ),
            ),
          ],
        );
        },
      ),
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

  Future<bool> _showExitConfirmation() async {
    return await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.black.withOpacity(0.9),
        title: Text(
          "Exit ${dotenv.env['APP_TITLE'] ?? "App"}?", 
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: const Text(
          "Are you sure you want to exit the app?",
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text("Cancel", style: TextStyle(color: Color(0xFFFCD34D))),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text("Exit", style: TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    ) ?? false;
  }

  Map<String, List<Channel>> _getGroupedChannels(ChannelProvider provider) {
    final Map<String, List<Channel>> grouped = {};
    final channels = provider.channels;

    // Add "All Channels" first if not empty
    if (channels.isNotEmpty) {
      grouped["All Channels"] = channels;
    }

    if (_groupBy == 'Categories') {
      for (var cat in provider.categories) {
        final list = channels.where((c) => c.category?.id == cat.id).toList();
        if (list.isNotEmpty) grouped[cat.name] = list;
      }
    } else {
      for (var lang in provider.languages) {
        final list = channels.where((c) => c.language?.id == lang.id).toList();
        if (list.isNotEmpty) grouped[lang.name] = list;
      }
    }

    return grouped;
  }

  Widget _buildChannelCard(Channel channel) {
    final isSelected = _selectedChannel?.uuid == channel.uuid;
    // Use thumbnail if available, else logo
    final String? displayImage = channel.thumbnailUrl != null && channel.thumbnailUrl!.isNotEmpty 
        ? channel.thumbnailUrl 
        : channel.logoUrl;

    return Builder(
      builder: (context) {
        // Focus handling for TV
        final focusNode = FocusNode();
        
        return InkWell(
          focusNode: focusNode,
          onTap: () => setState(() => _selectedChannel = channel),
          child: AnimatedBuilder(
            animation: focusNode,
            builder: (context, child) {
              final isFocused = focusNode.hasFocus;
              final active = isSelected || isFocused;
              
              return AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,
                transform: active ? Matrix4.identity().scaled(1.05) : Matrix4.identity(),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(8),
                  border: active ? Border.all(color: const Color(0xFF0EA5E9), width: 2) : Border.all(color: Colors.transparent, width: 2),
                  boxShadow: active ? [
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
                                child: CachedNetworkImage(
                                  imageUrl: displayImage, 
                                  fit: BoxFit.contain, 
                                  alignment: Alignment.center,
                                  placeholder: (context, url) => Center(
                                    child: Container(
                                      width: 32, height: 32,
                                      decoration: const BoxDecoration(color: Colors.white10, shape: BoxShape.circle),
                                    ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 1.5.seconds, color: Colors.white24),
                                  ),
                                  errorWidget: (context, url, error) => const Icon(Icons.tv, color: Colors.white24),
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
                    // Premium Badge
                    if (channel.isPremium)
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFBBF24), // Amber
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.workspace_premium, size: 10, color: Colors.black),
                              const SizedBox(width: 2),
                              const Text(
                                "PREMIUM",
                                style: TextStyle(color: Colors.black, fontSize: 9, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
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
                          "${channel.channelNumber ?? '-'}",
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
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

class SkeletonChannelCard extends StatelessWidget {
  const SkeletonChannelCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Expanded(
            child: Center(
              child: Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(
                  color: Colors.white10,
                  shape: BoxShape.circle,
                ),
              ).animate(onPlay: (c) => c.repeat())
               .shimmer(duration: 1.5.seconds, color: Colors.white24),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Container(
              height: 12,
              width: 60,
              decoration: BoxDecoration(
                 color: Colors.white10,
                 borderRadius: BorderRadius.circular(4)
              ),
            ).animate(onPlay: (c) => c.repeat())
             .shimmer(duration: 1.5.seconds, color: Colors.white24, delay: 200.ms),
          ),
        ],
      ),
    );
  }
}

class SkeletonAdBanner extends StatelessWidget {
  const SkeletonAdBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 100,
      width: double.infinity,
      color: Colors.black,
      child: Stack(
        children: [
          // Background shimmer
          Container(
            decoration: const BoxDecoration(
              color: Colors.white10,
            ),
          ).animate(onPlay: (c) => c.repeat())
           .shimmer(duration: 2.seconds, color: Colors.white24),
          
          // Ad label hint
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black26, 
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                "ADVERTISEMENT LOADING",
                style: TextStyle(
                  color: Colors.white24,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2.0,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
