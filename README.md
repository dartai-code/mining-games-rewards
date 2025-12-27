# Dart AI - Android App

## Overview
Dart AI is a mobile gaming app with mining, games, tasks, and leaderboards. All rewards are virtual points with no real-world value.

## AdMob Configuration (Production IDs)
```
APP ID: ca-app-pub-5844068054295246~2712349629
BANNER: ca-app-pub-5844068054295246/6013440009
REWARDED: ca-app-pub-5844068054295246/3209247149
INTERSTITIAL: ca-app-pub-5844068054295246/9714648346
```

## Community Links
- Telegram: https://t.me/+PZIPvIsWyPw2YjRl
- Discord: https://discord.gg/kkh4DZup

## Build Instructions

### Prerequisites
- Node.js 18+
- Android Studio with SDK 33+
- Java 17

### Setup
```bash
npm install
npm run build
npx cap add android
npx cap sync
```

### Build Debug APK
```bash
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk
# Rename to: DartAI_debug_v1.apk
```

### Build Release AAB
```bash
cd android
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
# Rename to: DartAI_release_v1.aab
```

### AndroidManifest.xml Setup
Add inside `<application>` tag:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-5844068054295246~2712349629" />
```

## Google Play Compliance
- All points/gems are virtual, in-game only
- No real money, crypto, or financial rewards
- Clear disclaimers throughout app
- No cash-out or withdrawal features

## Features
- 24h Mining sessions (virtual points)
- Mini-games with leaderboards
- Social tasks (Telegram, Discord, Twitter)
- Referral system (in-game bonuses)
- Community join flow on first launch

## Disclaimer
All points, gems, and items in Dart AI are virtual and used only inside the game. They do not represent real money, crypto, tokens, or financial rewards.
