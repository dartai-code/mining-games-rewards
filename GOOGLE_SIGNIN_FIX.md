# Google Sign-In Fix for Android

## Problem
Google Sign-In buffers indefinitely after selecting Google account on Android APK.

## Root Cause
The app was using `signInWithPopup` which only works on web, not native Android apps. Additionally, Firebase needs proper Android configuration.

## Solution Steps

### 1. Get SHA-1 Certificate Fingerprint

Your keystore is at: `android/keystore.jks`

Run this command to get your SHA-1:

```bash
keytool -list -v -keystore android/keystore.jks -alias key0
```

**Password:** `Rajat#1994`

Copy the **SHA-1** fingerprint (looks like: `AA:BB:CC:DD:...`)

### 2. Add SHA-1 to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon) → **General**
4. Scroll to **Your apps** → Select your Android app
5. Click **Add fingerprint**
6. Paste your SHA-1 fingerprint
7. Click **Save**

### 3. Download google-services.json

1. In Firebase Console → Project Settings → Your Android app
2. Click **Download google-services.json**
3. Place it here: `android/app/google-services.json`

### 4. Get Web Client ID from Firebase

1. In Firebase Console → Project Settings → **General** tab
2. Scroll to **Your apps** → **Web apps** section
3. Find your Web app (or create one if it doesn't exist)
4. Copy the **Web client ID** (looks like: `123456789-xxxxx.apps.googleusercontent.com`)

### 5. Update Environment Variables

Create/update `.env` file in project root:

```env
# Your existing Firebase config
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Add this - use the Web Client ID from step 4
VITE_GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

### 6. Update capacitor.config.ts

Update the `serverClientId` in [capacitor.config.ts](capacitor.config.ts):

```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Replace with your actual Web Client ID
  forceCodeForRefreshToken: true,
}
```

### 7. Sync Capacitor Changes

```bash
npx cap sync android
```

### 8. Rebuild APK

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleRelease
```

Your APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### 9. Sign the APK (if needed)

```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore android/app/release.keystore android/app/build/outputs/apk/release/app-release.apk release
```

## Testing

1. Install the APK on your Android device
2. Open the app
3. Try Google Sign-In
4. It should now work without buffering!

## Troubleshooting

### Still buffering?
- ✅ Verify SHA-1 is added in Firebase Console
- ✅ Verify `google-services.json` is in `android/app/`
- ✅ Verify Web Client ID is correct in both `.env` and `capacitor.config.ts`
- ✅ Run `npx cap sync android` after any config changes
- ✅ Rebuild the APK completely

### "Sign in failed" error?
- Check Firebase Console → **Authentication** → **Sign-in method** → Google is **enabled**
- Verify the Web Client ID matches exactly

### Other issues?
- Check Android Logcat: `adb logcat | grep -i google`
- Enable debug mode in `capacitor.config.ts`:
  ```typescript
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Change to true
    backgroundColor: '#030712'
  }
  ```

## What Changed

✅ Installed `@codetrix-studio/capacitor-google-auth` plugin
✅ Updated `firebaseAuthService.ts` to support native Android authentication
✅ Added GoogleAuth plugin configuration in `capacitor.config.ts`
✅ Now uses native Google Sign-In on Android instead of web popup

## Important Notes

- **Web version** continues to work with the existing `signInWithPopup` method
- **Android version** now uses native Google Sign-In SDK via Capacitor plugin
- The code automatically detects the platform and uses the appropriate method
- You need both the **Android SHA-1** and **Web Client ID** configured in Firebase
