import 'package:device_info_plus/device_info_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' hide Category;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../models/channel.dart';
import '../models/ad.dart';
import '../models/category.dart';
import '../models/language.dart';
import '../models/public_settings.dart';

class ApiService {
  late Dio _dio;
  late String _currentHost;
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  String? _cachedDeviceId;
  String? _cachedPlatform;

  ApiService() {
    String baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:8000/api';
    
    // Android Emulator specific fix for localhost
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android && baseUrl.contains('localhost')) {
       baseUrl = baseUrl.replaceFirst('localhost', '10.0.2.2');
    }

    try {
      _currentHost = Uri.parse(baseUrl).host;
    } catch (_) {
      _currentHost = '10.0.2.2'; 
    }

    BaseOptions options = BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      validateStatus: (status) => true,
      headers: {
        'X-API-KEY': dotenv.env['API_KEY'] ?? '',
        'Accept': 'application/json',
      },
    );

    _dio = Dio(options);
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        options.headers['X-Client-Platform'] = await _getPlatform();
        options.headers['X-Device-Id'] = await _getDeviceId();
        
        debugPrint('--- API Request ---');
        debugPrint('Method: ${options.method}');
        debugPrint('URL: ${options.baseUrl}${options.path}');
        debugPrint('Headers: ${options.headers}');
        if (options.data != null) {
          debugPrint('Body: ${options.data}');
        }
        debugPrint('-------------------');
        
        return handler.next(options);
      },
      onResponse: (response, handler) {
        debugPrint('--- API Response ---');
        debugPrint('Status: ${response.statusCode}');
        debugPrint('URL: ${response.requestOptions.baseUrl}${response.requestOptions.path}');
        debugPrint('Data: ${response.data}');
        debugPrint('--------------------');
        return handler.next(response);
      },
      onError: (DioException e, handler) {
        debugPrint('--- API Error ---');
        debugPrint('Message: ${e.message}');
        debugPrint('URL: ${e.requestOptions.baseUrl}${e.requestOptions.path}');
        if (e.response != null) {
           debugPrint('Status: ${e.response?.statusCode}');
           debugPrint('Data: ${e.response?.data}');
        }
        debugPrint('-----------------');
        return handler.next(e);
      },
    ));
  }

  // Platform Detection: Distinguishes between Mobile and TV (Leanback)
  Future<String> _getPlatform() async {
    if (_cachedPlatform != null) return _cachedPlatform!;
    
    if (kIsWeb) {
      _cachedPlatform = 'web';
    } else if (defaultTargetPlatform == TargetPlatform.android) {
      AndroidDeviceInfo androidInfo = await _deviceInfo.androidInfo;
      // Industry Standard: Check for Leanback feature to identify Android TV devices
      bool isTV = androidInfo.systemFeatures.contains('android.software.leanback') || 
                  androidInfo.host.toLowerCase().contains('tv') ||
                  androidInfo.model.toLowerCase().contains('tv');
      _cachedPlatform = isTV ? 'tv' : 'android'; // Changed 'mobile' to 'android'
    } else if (defaultTargetPlatform == TargetPlatform.iOS) {
      _cachedPlatform = 'ios'; // Changed 'mobile' to 'ios'
    } else {
      _cachedPlatform = 'unknown';
    }
    return _cachedPlatform!;
  }

  // Persistent Device Identification: Retrieves hardware IDs (Android ID or IdentifierForVendor)
  // to ensure one physical device only ever consumes one subscription slot.
  Future<String> _getDeviceId() async {
    if (_cachedDeviceId != null) return _cachedDeviceId!;

    try {
      if (kIsWeb) {
        _cachedDeviceId = 'web-session'; // Basic fallback for web if needed
      } else if (defaultTargetPlatform == TargetPlatform.android) {
        AndroidDeviceInfo androidInfo = await _deviceInfo.androidInfo;
        _cachedDeviceId = androidInfo.id; // Persistent Android ID
      } else if (defaultTargetPlatform == TargetPlatform.iOS) {
        IosDeviceInfo iosInfo = await _deviceInfo.iosInfo;
        _cachedDeviceId = iosInfo.identifierForVendor; // Persistent iOS ID
      }
    } catch (e) {
      _cachedDeviceId = 'unknown-device';
    }
    return _cachedDeviceId ?? 'unknown-device';
  }
  Future<List<Channel>> getChannels({int limit = -1}) async {
    final response = await _dio.get('/channels', queryParameters: {'limit': limit});
    
    if (response.statusCode == 200 && response.data['status'] == true) {
      final List data = response.data['data'];
      return data.map((json) => Channel.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load channels: ${response.data['message']}');
    }
  }

  Future<void> incrementView(String uuid) async {
    try {
      await _dio.post('/channels/$uuid/view');
    } catch (e) {
      print("Increment View Error: $e");
    }
  }



  Future<Channel> getChannelDetails(String uuid) async {
      final response = await _dio.get('/channels/$uuid');
      
      if (response.statusCode == 200 && response.data['status'] == true) {
         return Channel.fromJson(response.data['data']);
      } else {
        throw Exception('Failed to load channel details');
      }
  }
  Future<List<Ad>> getAds() async {
    try {
      final response = await _dio.get('/ads', options: Options(headers: {
        'X-API-KEY': dotenv.env['API_KEY'] ?? '',
        'Accept': 'application/json',
      }));
      if (response.statusCode == 200 && response.data['data'] != null) {
        final adsList = response.data['data']['ads'];
        if (adsList != null && adsList is List) {
          return adsList.map((e) => Ad.fromJson(e)).toList();
        }
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching ads: $e');
      return [];
    }
  }

  Future<void> recordAdImpression(String adUuid) async {
    try {
      await _dio.post('/ads/$adUuid/impression', options: Options(headers: {
        'X-API-KEY': dotenv.env['API_KEY'] ?? '',
        'Accept': 'application/json',
      }));
    } catch (e) {
      debugPrint('Error recording impression: $e');
    }
  }

  Future<List<Category>> getCategories() async {
    try {
      final response = await _dio.get('/categories', options: Options(headers: {
        'X-API-KEY': dotenv.env['API_KEY'] ?? '',
        'Accept': 'application/json',
      }));
      if (response.statusCode == 200 && response.data['data'] != null) {
        return (response.data['data'] as List).map((e) => Category.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching categories: $e');
      return [];
    }
  }

  Future<List<Language>> getLanguages() async {
    try {
      final response = await _dio.get('/languages', options: Options(headers: {
        'X-API-KEY': dotenv.env['API_KEY'] ?? '',
        'Accept': 'application/json',
      }));
      if (response.statusCode == 200 && response.data['data'] != null) {
        return (response.data['data'] as List).map((e) => Language.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching languages: $e');
      return [];
    }
  }

  Future<PublicSettings?> getPublicSettings() async {
    try {
      final response = await _dio.get('/settings/public', options: Options(headers: {
        'X-API-KEY': dotenv.env['API_KEY'] ?? '',
        'Accept': 'application/json',
      }));
      if (response.statusCode == 200 && response.data['data'] != null) {
        return PublicSettings.fromJson(response.data['data']);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching public settings: $e');
      return null;
    }
  }

  Future<void> reportChannelIssue(String channelUuid, String issueType, {String? description}) async {
    try {
      await _dio.post('/channels/$channelUuid/report', 
        data: {
          'issue_type': issueType,
          if (description != null && description.isNotEmpty) 'description': description,
        },
        options: Options(headers: {
          'X-API-KEY': dotenv.env['API_KEY'] ?? '',
          'Accept': 'application/json',
        })
      );
    } catch (e) {
      debugPrint('Error reporting channel issue: $e');
      rethrow;
    }
  }

  Future<bool> checkHealth() async {
    try {
      final response = await _dio.get('/health', options: Options(headers: {
        'Accept': 'application/json',
      }));
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Health check failed: $e');
      return false;
    }
  }
}
