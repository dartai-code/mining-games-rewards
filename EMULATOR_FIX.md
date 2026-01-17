# Emulator Memory Issue Fix

## Problem
The Android emulator is running out of memory, causing WebView processes to crash before the app's JavaScript code executes. This prevents Google Sign-In and other features from working.

## Solution 1: Increase Emulator RAM

1. **Open AVD Manager** in Android Studio:
   - Tools → Device Manager (or AVD Manager)

2. **Edit your emulator** (Medium Phone API 36):
   - Click the pencil icon (Edit) next to your emulator
   - Click "Show Advanced Settings"
   - Under "Memory and Storage":
     - Increase **RAM** to at least **4096 MB** (4 GB)
     - Increase **VM heap** to at least **512 MB**
   - Click "Finish"

3. **Restart the emulator** and test again

## Solution 2: Test on Real Device (Better)

Emulators don't represent real-world performance. Testing on an actual Android device will:
- Provide accurate memory management
- Test real Google Play Services (emulators often have issues)
- Show true app performance

### Steps to test on real device:
1. Enable Developer Options on your Android phone:
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging
3. Connect phone via USB
4. Install the APK:
   ```
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```
5. Test Google Sign-In on the real device

## Solution 3: Use Lighter Emulator

Create a new emulator with:
- **Device**: Pixel 5 or smaller
- **API Level**: 33 or 34 (instead of 36)
- **RAM**: 4096 MB
- **No Google Play** (if you're using Firebase, it works without Play Services in emulator)

## Current Logcat Shows:
```
Kill 'com.google.android.webview:sandboxed_process0' to free 89944kB rss
Scheduling restart of crashed service com.dartai.miner/org.chromium.content.app.SandboxedProcessService0:0
```

This means the emulator killed your app's WebView before it could load the JavaScript bundle.

## Verify Fix
After increasing RAM, check logcat for:
- Your console.log messages ("Starting Google Sign-In", "Platform:", etc.)
- No more "Kill" messages for your app's processes
- Successful WebView initialization
