import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../models/channel.dart';

class ApiService {
  late Dio _dio;
  
  late String _currentHost; // Store the actual host we are connecting to

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
      onRequest: (options, handler) {
        options.headers['X-Client-Platform'] = _getPlatform();
        // print("REQUEST[${options.method}] => PATH: ${options.path}");
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        print("ERROR[${e.response?.statusCode}] => PATH: ${e.requestOptions.path}");
        return handler.next(e);
      },
    ));
  }

  String _getPlatform() {
    if (kIsWeb) return 'web';
    if (defaultTargetPlatform == TargetPlatform.android) return 'android';
    if (defaultTargetPlatform == TargetPlatform.iOS) return 'ios';
    return 'tv';
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
}
