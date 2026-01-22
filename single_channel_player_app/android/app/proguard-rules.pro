# Flutter Wrapper
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# WebView (if used)
# -keep class com.google.android.gms.** { *; }
# -dontwarn com.google.android.gms.**
# -keep class android.webkit.** { *; }

# Better Player & Video Player
-keep class com.jhomlala.better_player.** { *; }
-keep class io.flutter.plugins.videoplayer.** { *; }

# Ignore Play Store Deferred Components (Fix for R8 Missing Class Errors)
-dontwarn com.google.android.play.core.**
-dontwarn io.flutter.embedding.engine.deferredcomponents.**
