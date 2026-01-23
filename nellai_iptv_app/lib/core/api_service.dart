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
      onRequest: (options, handler) {
        options.headers['X-Client-Platform'] = _getPlatform();
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        print("API Error: ${e.message}");
        return handler.next(e);
      },
    ));
  }

  String _getPlatform() {
    if (kIsWeb) return 'web';
    if (defaultTargetPlatform == TargetPlatform.android) return 'android'; // Could differentiate TV here if we had a check
    if (defaultTargetPlatform == TargetPlatform.iOS) return 'ios';
    return 'unknown';
  }

  // TODO: Add TV detection logic later using device_info_plus if strictly needed for 'tv' platform header

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
}
