import java.util.Properties
import java.io.FileInputStream

plugins {
    id("com.android.application")
    id("kotlin-android")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.nellaiiptv"
    compileSdk = 36 // Required by media_kit plugins
    ndkVersion = "27.0.12077973"

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_11.toString()
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.nellaiiptv"
        // You can update the following values to match your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = 35 // Explicitly target SDK 35 for Android 15 compatibility
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }


    signingConfigs {
        create("release") {
            val envFile = project.rootProject.file("../.env")
            val env = Properties()
            if (envFile.exists()) {
                envFile.inputStream().use { env.load(it) }
            }
            
            keyAlias = env.getProperty("KEY_ALIAS") ?: ""
            keyPassword = env.getProperty("KEY_PASSWORD") ?: ""
            val storeFileName = env.getProperty("STORE_FILE") ?: ""
            storeFile = if (storeFileName.isNotEmpty()) file(storeFileName) else null
            storePassword = env.getProperty("STORE_PASSWORD") ?: ""
        }
    }


    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

flutter {
    source = "../.."
}

dependencies {
    implementation("androidx.activity:activity:1.9.3")
}
