import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:device_info_plus/device_info_plus.dart';
import '../models/channel.dart';

class ApiService {
  late Dio _dio;
  late String _currentHost;
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  String? _cachedPlatform;
  String? _cachedDeviceId;

  ApiService() {
    String baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://10.0.2.2:8000/api';
    
    // Web-safe Android Emulator check
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android && baseUrl.contains('localhost')) {
       baseUrl = baseUrl.replaceFirst('localhost', '10.0.2.2');
    }

    try {
      _currentHost = Uri.parse(baseUrl).host;
    } catch (_) {
      _currentHost = '10.0.2.2'; // Fallback
    }

    BaseOptions options = BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      validateStatus: (status) => true, // Don't throw on 401/404/500
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
        // print("REQUEST[${options.method}] => PATH: ${options.path}");
        return handler.next(options);
      },
      onResponse: (response, handler) {
        debugPrint('--- API Response ---');
        debugPrint('Status: ${response.statusCode}');
        debugPrint('URL: ${response.requestOptions.baseUrl}${response.requestOptions.path}');
        // debugPrint('Data: ${response.data}'); // Concise logging
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
      _cachedPlatform = isTV ? 'tv' : 'android';
    } else if (defaultTargetPlatform == TargetPlatform.iOS) {
      _cachedPlatform = 'ios';
    } else {
      _cachedPlatform = 'unknown'; // Fallback for Windows/Linux
    }
    return _cachedPlatform!;
  }

  Future<String> _getDeviceId() async {
    if (_cachedDeviceId != null) return _cachedDeviceId!;

    try {
      if (kIsWeb) {
        _cachedDeviceId = 'web-session';
      } else if (defaultTargetPlatform == TargetPlatform.android) {
        AndroidDeviceInfo androidInfo = await _deviceInfo.androidInfo;
        _cachedDeviceId = androidInfo.id;
      } else if (defaultTargetPlatform == TargetPlatform.iOS) {
        IosDeviceInfo iosInfo = await _deviceInfo.iosInfo;
        _cachedDeviceId = iosInfo.identifierForVendor;
      }
    } catch (e) {
      _cachedDeviceId = 'unknown-device';
    }
    return _cachedDeviceId ?? 'unknown-device';
  }

  Future<String?> getAppLogo() async {
    final response = await _dio.get('/settings/public');
    if (response.statusCode == 200 && response.data['status'] == true) {
      String url = response.data['data']['app_logo_png_url'];
      
      // Dynamic Fix: If response has 'localhost' but we are talking to a different host (e.g. 10.0.2.2 or a domain)
      // replace response's localhost with the API's actual host.
      if (!kIsWeb && url.contains('localhost')) {
         url = url.replaceFirst('localhost', _currentHost);
      }
      return url;
    } else {
      print("Settings Error: ${response.data}");
    }
    return null;
  }

  Future<Channel> getChannelDetails(String uuid) async {
      final response = await _dio.get('/channels/$uuid');
      
      print("RESPONSE[${response.statusCode}]: ${response.data}");

      if (response.statusCode == 200 && response.data['status'] == true) {
         final data = response.data['data'];
         return Channel.fromJson(data);
      } else {
        // Handle 401/403/404 specifically
        String msg = response.data['message'] ?? 'Failed to load channel details';
        if (response.statusCode == 401) {
           msg = 'Unauthorized: $msg (Check API Key & Platform)';
        }
        throw Exception(msg);
      }
  }

  Future<void> incrementView(String uuid) async {
    try {
      await _dio.post('/channels/$uuid/view');
    } catch (e) {
      print("Increment View Error: $e");
    }
  }

  Future<void> decrementView(String uuid) async {
    try {
      await _dio.post('/channels/view/decrement', data: {'channel_uuid': uuid});
    } catch (e) {
      print("Decrement View Error: $e");
    }
  }
}
