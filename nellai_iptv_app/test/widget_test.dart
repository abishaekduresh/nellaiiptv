import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nellai_iptv_app/main.dart';
import 'package:nellai_iptv_app/screens/classic/classic_screen.dart';

void main() {
  testWidgets('App loads ClassicScreen', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const NellaiApp());

    // Verify that ClassicScreen is present
    expect(find.byType(ClassicScreen), findsOneWidget);
    expect(find.byType(Scaffold), findsOneWidget);
  });
}
