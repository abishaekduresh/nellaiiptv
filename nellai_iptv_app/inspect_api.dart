import 'dart:convert';
import 'package:dio/dio.dart';

void main() async {
  final dio = Dio();
  try {
    final response = await dio.get(
      'http://api.nellaiiptv.com/public/api/channels',
      queryParameters: {'limit': 1},
      options: Options(headers: {
        'X-API-KEY': 'nk_58d3c4c5046452a72e4aac756b0eb8e3', 
        'Accept': 'application/json',
        'X-Client-Platform': 'android'
      }),
    );
    print("Status: ${response.statusCode}");
    print("Data Type: ${response.data.runtimeType}");
    print("Data: ${response.data}");
  } catch (e) {
    if (e is DioException) {
      print(e.response?.data);
    } else {
      print(e);
    }
  }
}
