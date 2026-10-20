# BREAK FREE Android beta

- Java/Android WebView shell with local bundled app. No tracking, no user account.
- compileSdk/targetSdk **36** (2026 Google Play requirement).
- Debug APK comes from GitHub Actions **Build Android beta** artifact.
- Release AAB is **unsigned** and cannot be uploaded as a production app.
- Google Play Billing Library **9.1.0** is included, but checkout is intentionally **disabled** in BuildConfig. No live payment can occur from this build.
- Product ID reserved: `breakfree_vip_monthly` (subscription). Final ID and pricing must be configured in Play Console.
- The app needs genuinely useful VIP benefits, merchant/payments profile, Play Console app, server-side purchase verification, signing and review *before* setting BILLING_ENABLED=true.
- User smoking logs remain free; do not paywall craving support.
- Adult users only. Cigarette simulation can be triggering and can be rejected by the stores.
- Use the website version while native Android builds are tested.

## Local build
1. Install Android SDK Platform 36, JDK 17, Android Studio / Gradle 8.13.
2. From `android/`, run `gradle :app:assembleDebug`.
3. The debug APK is at `app/build/outputs/apk/debug/app-debug.apk`.

Android beta uses a different storage area from Safari/PWA. Existing data are not transferred automatically; use the JSON export/import feature.
