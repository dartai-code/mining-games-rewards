# Quick Setup - Google Sign-In for Android

## ⚡ Your SHA-1 Fingerprint

```
5B:1D:5A:1A:2A:6A:89:7C:C2:B4:52:CB:97:3D:E4:29:D2:A4:34:5E
```

## 🚀 Quick Setup Steps

### Step 1: Add SHA-1 to Firebase (MOST IMPORTANT!)

1. Go to: https://console.firebase.google.com
2. Select your project → ⚙️ Settings → General
3. Scroll to "Your apps" → Click your Android app
4. Click **"Add fingerprint"**
5. Paste: `5B:1D:5A:1A:2A:6A:89:7C:C2:B4:52:CB:97:3D:E4:29:D2:A4:34:5E`
6. Click **Save**

### Step 2: Download google-services.json

1. In same page, click **"Download google-services.json"**
2. Save it to: `android/app/google-services.json`

### Step 3: Get Web Client ID

1. Firebase Console → ⚙️ Settings → General
2. Look for **"Web API Key"** or create a Web app
3. Copy the **Web Client ID** (format: `123456-xxxxx.apps.googleusercontent.com`)

### Step 4: Create .env file (in project root)

Create a file named `.env` in the root folder:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Important: Add your Web Client ID here
VITE_GOOGLE_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
```

### Step 5: Update capacitor.config.ts

Open `capacitor.config.ts` and update the GoogleAuth serverClientId:

```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Use your actual Web Client ID
  forceCodeForRefreshToken: true,
}
```

### Step 6: Enable Google Sign-In in Firebase

1. Firebase Console → **Authentication** → **Sign-in method**
2. Click **Google** → Enable → Save

### Step 7: Rebuild Your APK

```bash
# Sync Capacitor
npx cap sync android

# Build production
npm run build

# Sync again
npx cap sync android

# Build APK
cd android
./gradlew assembleRelease
```

APK location: `android/app/build/outputs/apk/release/app-release.apk`

### Step 8: Install & Test

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

## ✅ Checklist

- [ ] SHA-1 added to Firebase Console
- [ ] google-services.json downloaded and placed in `android/app/`
- [ ] Web Client ID added to `.env` file
- [ ] Web Client ID added to `capacitor.config.ts`
- [ ] Google Sign-In enabled in Firebase Console
- [ ] Run `npx cap sync android`
- [ ] Rebuild APK
- [ ] Test on Android device

## 🐛 Still Not Working?

### Check these:

1. **Verify SHA-1 in Firebase:**
   - Go to Firebase Console → Settings → Your Android app
   - Confirm the SHA-1 fingerprint is listed

2. **Verify google-services.json:**
   - File should be at: `android/app/google-services.json`
   - Not `android/google-services.json`

3. **Verify Web Client ID:**
   - Check it's the **Web Client ID**, not Android Client ID
   - Format: `123456789-xxxxx.apps.googleusercontent.com`

4. **Check Firebase Authentication:**
   - Firebase Console → Authentication → Sign-in method
   - Google should be **Enabled**

5. **Clean rebuild:**
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleRelease
   ```

## 📱 What Changed in Your Code

✅ Installed `@codetrix-studio/capacitor-google-auth` plugin
✅ Updated `firebaseAuthService.ts` to use native Google Sign-In on Android
✅ Added GoogleAuth configuration in `capacitor.config.ts`
✅ Web version continues to work normally

The app now automatically detects if it's running on Android and uses native Google Sign-In instead of the web popup!
