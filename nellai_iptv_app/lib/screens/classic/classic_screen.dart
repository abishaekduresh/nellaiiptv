import 'dart:async';
import 'dart:io'; // Import for exit(0)
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/services.dart';
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
import '../../core/audio_manager.dart';

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
  
  // Search State
  bool _isSearching = false;
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  
  // Settings
  PublicSettings? _settings;

  // Number Navigation State
  String _numberBuffer = "";
  Timer? _numberTimer;
  final FocusNode _rootFocusNode = FocusNode();
  final FocusNode _playerFocusNode = FocusNode(); // Dedicated focus node for player area

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
    try {
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
    } catch (e) {
      if (mounted) setState(() => _isLoadingAds = false);
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
    _numberTimer?.cancel();
    _searchController.dispose();
    _searchFocusNode.dispose();

    _rootFocusNode.dispose();
    _playerFocusNode.dispose();
    AudioManager().restoreOriginalVolume(); // Restore volume when leaving the screen
    super.dispose();
  }

  void _handleNumberInput(String digit) {
    _numberTimer?.cancel();
    setState(() {
      _numberBuffer += digit;
    });

    _numberTimer = Timer(const Duration(milliseconds: 1500), () {
      _navigateToChannelByNumber();
    });
  }

  void _navigateToChannelByNumber() {
    if (_numberBuffer.isEmpty) return;

    final provider = context.read<ChannelProvider>();
    final targetNumber = int.tryParse(_numberBuffer);
    
    if (targetNumber != null) {
      final channel = provider.channels.firstWhere(
        (c) => c.channelNumber == targetNumber,
        orElse: () => provider.channels.firstWhere(
          (c) => c.channelNumber.toString().startsWith(_numberBuffer),
          orElse: () => provider.channels.first, // or null
        ),
      );

      // Actually, let's be strict if the user typed a full number.
      final exactChannel = provider.channels.where((c) => c.channelNumber == targetNumber).toList();
      
      if (exactChannel.isNotEmpty && mounted) {
        setState(() {
          _selectedChannel = exactChannel.first;
        });
      }
    }

    setState(() {
      _numberBuffer = "";
    });
  }

  void _changeChannel(int offset) {
    if (_selectedChannel == null) return;
    
    final provider = context.read<ChannelProvider>();
    final channels = provider.filteredChannels.isNotEmpty ? provider.filteredChannels : provider.channels;
    
    if (channels.isEmpty) return;
    
    final currentIndex = channels.indexWhere((c) => c.uuid == _selectedChannel!.uuid);
    if (currentIndex == -1) return;
    
    int newIndex = currentIndex + offset;
    
    // Loop around
    if (newIndex < 0) newIndex = channels.length - 1;
    if (newIndex >= channels.length) newIndex = 0;
    
    setState(() {
      _selectedChannel = channels[newIndex];
    });
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        
        // 1. If in Fullscreen, exit fullscreen first
        if (_isFullScreen) {
          setState(() => _isFullScreen = false);
          return;
        }

        // 2. If Channel Overlay is shown, hide it
        if (_showChannelOverlay) {
          setState(() => _showChannelOverlay = false);
          return;
        }

        // 3. If searching, exit search mode
        if (_isSearching) {
          setState(() {
            _isSearching = false;
            _searchController.clear();
          });
          context.read<ChannelProvider>().search('');
          return;
        }

        // 4. Otherwise show exit confirmation
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
          
          return Focus(
            autofocus: true,
            focusNode: _rootFocusNode,
            onKeyEvent: (node, event) {
              if (event is KeyDownEvent) {
                final logicKey = event.logicalKey;
                // Check for 0-9 keys
                if (logicKey.keyId >= LogicalKeyboardKey.digit0.keyId && 
                    logicKey.keyId <= LogicalKeyboardKey.digit9.keyId) {
                  final digit = logicKey.keyLabel;
                  _handleNumberInput(digit);
                  return KeyEventResult.handled;
                }
                // Also check for Numpad 0-9
                if (logicKey.keyId >= LogicalKeyboardKey.numpad0.keyId && 
                    logicKey.keyId <= LogicalKeyboardKey.numpad9.keyId) {
                  final digit = logicKey.keyLabel.replaceAll('Numpad ', '');
                  _handleNumberInput(digit);
                  return KeyEventResult.handled;
                }

                // D-Pad Navigation in Fullscreen
                if (_isFullScreen) {
                   if (logicKey == LogicalKeyboardKey.arrowUp) {
                      _changeChannel(-1);
                      return KeyEventResult.handled;
                   } else if (logicKey == LogicalKeyboardKey.arrowDown) {
                      _changeChannel(1);
                      return KeyEventResult.handled;
                   } else if (logicKey == LogicalKeyboardKey.arrowLeft) {
                      // Show Overlay
                      if (!_showChannelOverlay) setState(() => _showChannelOverlay = true);
                      return KeyEventResult.handled;
                   } else if (logicKey == LogicalKeyboardKey.arrowRight) {
                      // Toggle info or close overlay
                      if (_showChannelOverlay) {
                         setState(() => _showChannelOverlay = false);
                      } else {
                         // Maybe show info? For now just ignore or show controls
                      }
                      return KeyEventResult.handled;
                   }
                }
              }
              return KeyEventResult.ignored;
            },
            child: Row(
              children: [
              // Left Panel (Player + Info + Ads)
          Expanded(
            flex: 5,
            child: Column(
              children: [
                // Player Area - Maximized (Flex 6 normally, or expanded if fullscreen)
                Expanded(
                  child: FocusTraversalGroup(
                    policy: OrderedTraversalPolicy(), // Structured navigation
                    child: Container(
                      color: Colors.transparent,
                      child: Stack(
                        children: [
                          _selectedChannel != null 
                          ? Focus(
                              // Wrapper focus to capture D-Pad when player is embedded but focused
                              focusNode: _playerFocusNode,
                              onKeyEvent: (node, event) {
                                if (event is KeyDownEvent) {
                                   if (!_isFullScreen && (event.logicalKey == LogicalKeyboardKey.select || event.logicalKey == LogicalKeyboardKey.enter || event.logicalKey == LogicalKeyboardKey.numpadEnter)) {
                                      // OK/Select on Embedded Player -> Go Fullscreen
                                      setState(() => _isFullScreen = true);
                                      return KeyEventResult.handled;
                                   }
                                   // Allow navigating back to channel list
                                   if (!_isFullScreen && event.logicalKey == LogicalKeyboardKey.arrowRight) {
                                      FocusScope.of(context).focusInDirection(TraversalDirection.right);
                                      return KeyEventResult.handled;
                                   }
                                }
                                return KeyEventResult.ignored;
                              },
                              child: EmbeddedPlayer(
                                channelUuid: _selectedChannel!.uuid, 
                                initialChannel: _selectedChannel,
                                key: ValueKey(_selectedChannel!.uuid),
                                isFullScreen: _isFullScreen,
                                hideControls: _showChannelOverlay,
                                onDoubleTap: () => setState(() => _isFullScreen = !_isFullScreen),
                                onTap: () {
                                  // Mouse/Touch Tap Logic
                                  if (_isFullScreen) {
                                    setState(() => _showChannelOverlay = !_showChannelOverlay);
                                  } else {
                                    // If embedded and tapped -> Fullscreen
                                    setState(() => _isFullScreen = true);
                                  }
                                },
                                onChannelLoaded: (updatedChannel) {
                                   if (mounted && _selectedChannel?.uuid == updatedChannel.uuid) {
                                      setState(() {
                                        _selectedChannel = updatedChannel;
                                      });
                                   }
                                },
                              ),
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

                        // Visual Number Input Overlay
                        if (_numberBuffer.isNotEmpty)
                          Positioned(
                            top: 20,
                            right: 20,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                              decoration: BoxDecoration(
                                color: Colors.blue.withOpacity(0.8),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: Colors.white, width: 2),
                              ),
                              child: Text(
                                _numberBuffer,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 48,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ).animate().scale(duration: 200.ms, curve: Curves.easeOut),
                          ),
                      ],
                    ),
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
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black26,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.white10),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // View Count
                            Icon(Icons.remove_red_eye, color: const Color(0xFF0EA5E9), size: 14),
                            const SizedBox(width: 4),
                            Text(
                              _selectedChannel!.viewersCountFormatted ?? "0",
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                            
                            // Separator
                            const SizedBox(width: 12),
                            Container(width: 1, height: 12, color: Colors.white24),
                            const SizedBox(width: 12),

                            // Rating
                            Icon(Icons.star, color: const Color(0xFFFBBF24), size: 14),
                            const SizedBox(width: 4),
                            Text(
                              _selectedChannel!.averageRating?.toStringAsFixed(1) ?? "0.0",
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ) : const SizedBox(),
                ),

                // Ad Banner - Shown only if ads exist
                if (!_isFullScreen && _ads.isNotEmpty)
                  FocusableAdBanner(
                     ad: _ads[_currentAdIndex],
                     onTap: () async {
                         final url = _ads[_currentAdIndex].linkUrl;
                         if (url != null && url.isNotEmpty) {
                             final uri = Uri.parse(url);
                             if (await canLaunchUrl(uri)) {
                                 await launchUrl(uri, mode: LaunchMode.externalApplication);
                             }
                         }
                     },
                  ),
              ],
            ),
          ),



          // Right Panel (Grid + Filters)
          if (!_isFullScreen)
          Expanded(
            flex: 5,
            child: Column( // Removed FocusTraversalGroup to allow manual D-Pad control
              children: [
                   Consumer<ChannelProvider>(
                     builder: (context, provider, _) { 
// ... (Keeping the rest context, but I need to jump to the class definitions)
                        // Always Show Logo and App Name layout
                        Widget titleWidget = Row(
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(right: 12.0),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: (_settings != null && _settings!.logoUrl != null && _settings!.logoUrl!.isNotEmpty)
                                      ? Image.network(
                                          _settings!.logoUrl!,
                                          height: 42, 
                                          width: 42,
                                          fit: BoxFit.contain,
                                          errorBuilder: (_,__,___) => Image.asset(
                                            'assets/img/logo.png',
                                            height: 42,
                                            width: 42,
                                            fit: BoxFit.contain,
                                          ),
                                        )
                                      : Image.asset(
                                          'assets/img/logo.png',
                                          height: 42,
                                          width: 42,
                                          fit: BoxFit.contain,
                                        ),
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _settings?.appName ?? dotenv.env['APP_TITLE'] ?? "Nellai IPTV",
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)
                                    ),
                                    const Text(
                                      "CLASSIC",
                                      style: TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 1.2)
                                    ),
                                  ],
                                ),
                              ],
                            ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1, end: 0);

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
                                   // Title or Search Bar
                                   Expanded(
                                     child: _isSearching 
                                     ? Padding(
                                         padding: const EdgeInsets.only(right: 16.0),
                                           child: Actions(
                                             actions: {
                                               ActivateIntent: CallbackAction<ActivateIntent>(
                                                 onInvoke: (intent) {
                                                   SystemChannels.textInput.invokeMethod('TextInput.show');
                                                   return null;
                                                 },
                                               ),
                                             },
                                             child: TextField(
                                               controller: _searchController,
                                               focusNode: _searchFocusNode,
                                               autofocus: true, // Auto focus when searching starts
                                               textInputAction: TextInputAction.search, // Show search button on keyboard
                                               style: const TextStyle(color: Colors.white),
                                               decoration: InputDecoration(
                                                 hintText: "Search channels...",
                                                 hintStyle: const TextStyle(color: Colors.white54),
                                                 border: OutlineInputBorder(
                                                   borderRadius: BorderRadius.circular(8),
                                                   borderSide: const BorderSide(color: Color(0xFF06B6D4)),
                                                 ),
                                                 enabledBorder: OutlineInputBorder(
                                                   borderRadius: BorderRadius.circular(8),
                                                   borderSide: const BorderSide(color: Colors.white24),
                                                 ),
                                                 focusedBorder: OutlineInputBorder(
                                                   borderRadius: BorderRadius.circular(8),
                                                   borderSide: const BorderSide(color: Color(0xFF06B6D4)),
                                                 ),
                                                 contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                                                 prefixIcon: const Icon(Icons.search, color: Color(0xFF06B6D4)),
                                                 suffixIcon: IconButton(
                                                   icon: const Icon(Icons.close, color: Colors.white54),
                                                   onPressed: () {
                                                     _searchController.clear();
                                                     setState(() {
                                                       _isSearching = false;
                                                     });
                                                     provider.search(''); // Clear filter
                                                   },
                                                 ),
                                               ),
                                               onTap: () {
                                                  // Explicitly request keyboard on tap (which Select key simulates in some environments)
                                                  SystemChannels.textInput.invokeMethod('TextInput.show');
                                               },
                                               onChanged: (value) => provider.search(value),
                                               onSubmitted: (value) {
                                                 // Ensure search is triggered on keyboard "Search" button press
                                                 provider.search(value);
                                                 // Optionally keep focus or move focus elsewhere if needed
                                               },
                                             ),
                                           ),
                                       )
                                     : titleWidget,
                                   ),

                                   Row(
                                     children: [
                                       // Search Trigger Button (Only show if not searching)
                                       if (!_isSearching) ...[
                                          Builder(
                                            builder: (context) {
                                              final searchBtnFocus = FocusNode();
                                              return InkWell(
                                                focusNode: searchBtnFocus,
                                                onTap: () {
                                                  setState(() {
                                                    _isSearching = true;
                                                    // Global search: Reset other filters
                                                    provider.selectCategory(null);
                                                    provider.selectLanguage(null);
                                                  });
                                                  // Request focus after rebuild
                                                  WidgetsBinding.instance.addPostFrameCallback((_) {
                                                    _searchFocusNode.requestFocus();
                                                  });
                                                },
                                                borderRadius: BorderRadius.circular(4),
                                                child: AnimatedBuilder(
                                                  animation: searchBtnFocus,
                                                  builder: (context, _) {
                                                    return Container(
                                                      height: 30,
                                                      width: 30,
                                                      decoration: BoxDecoration(
                                                        color: searchBtnFocus.hasFocus ? const Color(0xFF0EA5E9) : const Color(0xFF1E293B),
                                                        border: Border.all(color: Colors.white24),
                                                        borderRadius: BorderRadius.circular(4),
                                                      ),
                                                      child: Icon(
                                                        Icons.search,
                                                        size: 18,
                                                        color: searchBtnFocus.hasFocus ? Colors.white : Colors.white70,
                                                      ),
                                                    );
                                                  },
                                                ),
                                              );
                                            }
                                          ),
                                          const SizedBox(width: 8),
                                       ],

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
                                       Builder(
                                         builder: (context) {
                                           final groupFocus = FocusNode();
                                           return InkWell(
                                              focusNode: groupFocus,
                                              onTap: () {
                                                 setState(() {
                                                    _groupBy = _groupBy == 'Categories' ? 'Languages' : 'Categories';
                                                    provider.selectCategory(null); // Reset filters
                                                 });
                                              },
                                              borderRadius: BorderRadius.circular(4),
                                              child: AnimatedBuilder(
                                                animation: groupFocus,
                                                builder: (context, _) {
                                                  return Container(
                                                   height: 30,
                                                   padding: const EdgeInsets.symmetric(horizontal: 12),
                                                   decoration: BoxDecoration(
                                                      color: const Color(0xFF1E293B),
                                                      border: groupFocus.hasFocus 
                                                          ? Border.all(color: const Color(0xFF06B6D4), width: 2)
                                                          : Border.all(color: Colors.white24), 
                                                      borderRadius: BorderRadius.circular(4),
                                                      boxShadow: groupFocus.hasFocus ? [
                                                         BoxShadow(color: const Color(0xFF06B6D4).withOpacity(0.4), blurRadius: 6)
                                                      ] : [],
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
                                                  );
                                                }
                                              ),
                                           );
                                         }
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
                                      final isAllSelected = provider.selectedCategory == null && provider.selectedLanguage == null;
                                      return FocusableCategoryChip(
                                        label: "All", 
                                        isSelected: isAllSelected, 
                                        onTap: () => provider.selectCategory(null)
                                      );
                                   }
                                   
                                   if (_groupBy == 'Categories') {
                                      final cat = provider.categories[index - 1];
                                      return FocusableCategoryChip(
                                        label: cat.name, 
                                        isSelected: provider.selectedCategory == cat, 
                                        onTap: () => provider.selectCategory(cat)
                                      );
                                   } else {
                                      final lang = provider.languages[index - 1];
                                      return FocusableCategoryChip(
                                        label: lang.name, 
                                        isSelected: provider.selectedLanguage == lang, 
                                        onTap: () => provider.selectLanguage(lang)
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
                               return FocusableChannelCard(
                                 channel: channels[index],
                                 isSelected: _selectedChannel?.uuid == channels[index].uuid,
                                 onTap: () => setState(() => _selectedChannel = channels[index]),
                                 index: index,
                                 totalColumns: 3,
                                 onFocusLeft: () {
                                   _playerFocusNode.requestFocus();
                                 },
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
         ),
       );
       },
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
      barrierColor: Colors.black.withOpacity(0.8), // Darker overlay
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent, // Use Container decoration
        insetPadding: const EdgeInsets.symmetric(horizontal: 24),
        child: Container(
          width: 400, // Fixed width for TV
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF1E293B), Color(0xFF0F172A)], // Slate 800 -> Slate 900
            ),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white10, width: 1),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.5),
                blurRadius: 20,
                spreadRadius: 2,
              )
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icon
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.power_settings_new, color: Colors.redAccent, size: 32),
              ),
              const SizedBox(height: 16),
              
              // Title
              Text(
                "Exit ${dotenv.env['APP_TITLE'] ?? "Nellai IPTV"}?", 
                style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              
              // Message
              const Text(
                "Are you sure you want to exit the application?",
                style: TextStyle(color: Colors.white70, fontSize: 14),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              // Buttons Row
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Cancel Button
                  _buildDialogButton(
                    label: "Cancel",
                    icon: Icons.close,
                    color: Colors.white10,
                    textColor: Colors.white,
                    autofocus: true, // Default focus on Cancel
                    onTap: () => Navigator.of(context).pop(false),
                  ),
                  const SizedBox(width: 16),

                  // Exit Button
                  _buildDialogButton(
                    label: "Exit",
                    icon: Icons.check,
                    color: Colors.redAccent,
                    textColor: Colors.white,
                    autofocus: false,
                    onTap: () => Navigator.of(context).pop(true),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    ) ?? false;
  }

  Widget _buildDialogButton({
    required String label,
    required IconData icon,
    required Color color,
    required Color textColor,
    required VoidCallback onTap,
    bool autofocus = false,
  }) {
    return Builder(
      builder: (context) {
        final FocusNode focusNode = FocusNode();
        return InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          autofocus: autofocus,
          focusNode: focusNode,
          child: AnimatedBuilder(
            animation: focusNode,
            builder: (context, child) {
              final isFocused = focusNode.hasFocus;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: isFocused ? Colors.white : color,
                  borderRadius: BorderRadius.circular(8),
                  border: isFocused 
                      ? Border.all(color: textColor, width: 2) 
                      : Border.all(color: Colors.transparent, width: 2),
                  boxShadow: isFocused ? [
                    BoxShadow(color: textColor.withOpacity(0.4), blurRadius: 8)
                  ] : [],
                ),
                child: Row(
                  children: [
                    Icon(icon, size: 18, color: isFocused ? Colors.black : textColor),
                    const SizedBox(width: 8),
                    Text(
                      label,
                      style: TextStyle(
                        color: isFocused ? Colors.black : textColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      }
    );
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
}

class FocusableCategoryChip extends StatefulWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const FocusableCategoryChip({
    super.key,
    required this.label, 
    required this.isSelected,
    required this.onTap,
  });

  @override
  State<FocusableCategoryChip> createState() => _FocusableCategoryChipState();
}

class _FocusableCategoryChipState extends State<FocusableCategoryChip> {
  final FocusNode _internalFocusNode = FocusNode();

  @override
  void dispose() {
    _internalFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Focus(
      focusNode: _internalFocusNode,
      onKeyEvent: (node, event) {
        if (event is KeyDownEvent) {
          final isSelect = event.logicalKey == LogicalKeyboardKey.select || 
                           event.logicalKey == LogicalKeyboardKey.enter ||
                           event.logicalKey == LogicalKeyboardKey.numpadEnter ||
                           event.logicalKey == LogicalKeyboardKey.space;

          if (isSelect) {
            widget.onTap();
            return KeyEventResult.handled;
          }
        }
        return KeyEventResult.ignored;
      },
      child: Builder(
        builder: (context) {
           final isFocused = _internalFocusNode.hasFocus;
           return GestureDetector(
             onTap: widget.onTap,
             child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: widget.isSelected 
                      ? const Color(0xFF0EA5E9) 
                      : (isFocused ? const Color(0xFF334155).withOpacity(0.8) : const Color(0xFF334155)),
                  borderRadius: BorderRadius.circular(4),
                  border: isFocused 
                      ? Border.all(color: const Color(0xFF06B6D4), width: 2) 
                      : (widget.isSelected ? null : Border.all(color: Colors.white10)),
                  boxShadow: isFocused ? [
                    BoxShadow(color: const Color(0xFF06B6D4).withOpacity(0.4), blurRadius: 8, spreadRadius: 1)
                  ] : [],
                ),
                child: Text(
                  widget.label,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: (widget.isSelected || isFocused) ? FontWeight.bold : FontWeight.normal
                  )
                ),
              ),
           );
        }
      ),
    );
  }
}

class FocusableChannelCard extends StatefulWidget {
  final Channel channel;
  final bool isSelected;
  final VoidCallback onTap;
  final int index; // For grid navigation
  final int totalColumns; 
  final VoidCallback? onFocusLeft;

  const FocusableChannelCard({
    super.key,
    required this.channel,
    required this.isSelected,
    required this.onTap,
    this.index = 0,
    this.totalColumns = 3,
    this.onFocusLeft,
  });

  @override
  State<FocusableChannelCard> createState() => _FocusableChannelCardState();
}

class _FocusableChannelCardState extends State<FocusableChannelCard> {
  final FocusNode _internalFocusNode = FocusNode();

  @override
  void dispose() {
    _internalFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final channel = widget.channel;
    final isSelected = widget.isSelected;
    
    // Use thumbnail if available, else logo
    final String? displayImage = channel.thumbnailUrl != null && channel.thumbnailUrl!.isNotEmpty 
        ? channel.thumbnailUrl 
        : channel.logoUrl;

    return Focus(
      focusNode: _internalFocusNode,
      onKeyEvent: (node, event) {
        if (event is KeyDownEvent) {
          final logicalKey = event.logicalKey;

          // D-Pad Navigation logic
          if (logicalKey == LogicalKeyboardKey.arrowUp) {
             FocusScope.of(context).focusInDirection(TraversalDirection.up);
             return KeyEventResult.handled;
          } else if (logicalKey == LogicalKeyboardKey.arrowDown) {
             FocusScope.of(context).focusInDirection(TraversalDirection.down);
             return KeyEventResult.handled;
          } else if (logicalKey == LogicalKeyboardKey.arrowRight) {
             FocusScope.of(context).focusInDirection(TraversalDirection.right);
             return KeyEventResult.handled;
          } else if (logicalKey == LogicalKeyboardKey.arrowLeft) {
             // Check if valid to move left in grid
             if (widget.index % widget.totalColumns == 0) {
                // First column -> Move to Sidebar/Player
                if (widget.onFocusLeft != null) {
                   widget.onFocusLeft!();
                   return KeyEventResult.handled;
                }
             } else {
                FocusScope.of(context).focusInDirection(TraversalDirection.left);
                return KeyEventResult.handled;
             }
          }

          final isSelect = logicalKey == LogicalKeyboardKey.select || 
                           logicalKey == LogicalKeyboardKey.enter ||
                           logicalKey == LogicalKeyboardKey.numpadEnter ||
						   logicalKey == LogicalKeyboardKey.gameButtonA;

          if (isSelect) {
            widget.onTap(); 
            return KeyEventResult.handled;
          }
        }
        return KeyEventResult.ignored;
      },
      child: Builder(
        builder: (context) {
          final isFocused = _internalFocusNode.hasFocus;
          final active = isSelected || isFocused;

          return GestureDetector(
             onTap: widget.onTap,
             child: AnimatedContainer(
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
                                  placeholder: (context, url) => const Center(
                                    child: CupertinoActivityIndicator(color: Colors.white54, radius: 12),
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
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          channel.channelNumber?.toString() ?? "-",
                          style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          );
        }
      ),
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
      child: const Center(
        child: CupertinoActivityIndicator(color: Colors.white24, radius: 12),
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
      color: Colors.transparent,
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
                  color: Colors.white,
                  fontSize: 10,
                  letterSpacing: 1.5,
                  fontWeight: FontWeight.bold
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class FocusableAdBanner extends StatefulWidget {
  final Ad ad;
  final VoidCallback onTap;

  const FocusableAdBanner({
    super.key,
    required this.ad,
    required this.onTap,
  });

  @override
  State<FocusableAdBanner> createState() => _FocusableAdBannerState();
}

class _FocusableAdBannerState extends State<FocusableAdBanner> {
  final FocusNode _focusNode = FocusNode();

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      focusNode: _focusNode,
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: _focusNode,
        builder: (context, child) {
          final isFocused = _focusNode.hasFocus;
          return AnimatedContainer(
            duration: 200.ms,
            height: 100,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.transparent,
              border: isFocused 
                  ? Border.all(color: const Color(0xFF0EA5E9), width: 4) // Thick border for Ads
                  : Border.all(color: Colors.transparent, width: 4),
              boxShadow: isFocused ? [
                   BoxShadow(color: const Color(0xFF0EA5E9).withOpacity(0.5), blurRadius: 10, spreadRadius: 2)
              ] : [],
            ),
            child: CachedNetworkImage(
              imageUrl: widget.ad.imageUrl,
              fit: BoxFit.fill,
              placeholder: (context, url) => const SkeletonAdBanner(),
              errorWidget: (context, url, error) => const SizedBox(), 
            ),
          );
        },
      ),
    ).animate(key: ValueKey(widget.ad.uuid)).fadeIn();
  }
}
