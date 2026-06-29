import 'package:flutter_test/flutter_test.dart';
import 'package:nellai_iptv_app/core/toast_service.dart';

// NOTE: A full `pumpWidget(MyApp())` smoke test is intentionally avoided here.
// The app's first screen (SplashScreen) depends on platform plugins
// (package_info_plus, in_app_update, app_links), a 3-second delayed navigation
// future, and repeating animations. Under the test harness those leave pending
// timers / throw MissingPluginException, producing a flaky test rather than a
// meaningful one. These deterministic checks exercise real app code instead.
void main() {
  group('ToastService', () {
    test('is a singleton (factory returns the same instance)', () {
      expect(identical(ToastService(), ToastService()), isTrue);
    });

    test('exposes a scaffold messenger key for global snackbars', () {
      expect(ToastService().snackbarKey, isNotNull);
    });
  });
}
