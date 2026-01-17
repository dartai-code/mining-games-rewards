# Google Sign-In Android Fix

## The Issue
Google Sign-In fails in Android app with an error because the SHA-1 fingerprint is not configured in Firebase.

## Steps to Fix:

### Step 1: Get Your SHA-1 Fingerprint

#### For Debug Build:
Run this command in PowerShell:
```powershell
cd android
./gradlew signingReport
```

Look for the **SHA-1** under `Variant: debug` section. It will look like:
```
SHA1: AA:BB:CC:DD:EE:FF:11:22:33:44:55:66:77:88:99:00:11:22:33:44
```

#### For Release Build (if using keystore):
```powershell
keytool -list -v -keystore keystore.jks -alias key0
```
Enter your keystore password when prompted.

### Step 2: Add SHA-1 to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **dart-ai-f8515**
3. Click on **Project Settings** (gear icon)
4. Scroll down to **Your apps** section
5. Find your Android app (or add one if not exists)
6. Click **Add fingerprint**
7. Paste your **SHA-1** fingerprint
8. Click **Save**

### Step 3: Download Updated google-services.json

1. In Firebase Console, click **Download google-services.json**
2. Replace the file at: `android/app/google-services.json`

### Step 4: Rebuild the App

```powershell
cd android
./gradlew clean
cd..
npm run build
npx cap sync android
npx cap open android
```

Then rebuild the APK in Android Studio.

## Important Notes:

- You need **both** debug SHA-1 (for testing) and release SHA-1 (for production)
- The Web Client ID in `.env` is correct: `839535063372-o1pjt9ejq8nsh6ro9g1o423ctt2d5t1t.apps.googleusercontent.com`
- No need to add Android Client ID separately - Firebase auto-creates it when you add SHA-1

## If Still Not Working:

1. Make sure you're using the correct package name: Check `android/app/build.gradle` for `applicationId`
2. Make sure Firebase project has Google Sign-In enabled:
   - Go to Firebase Console → Authentication → Sign-in method
   - Enable Google
3. Clear app data and cache before testing
4. Try Guest sign-in to verify Firebase connection is working

## Test Commands:

```powershell
# Clean and rebuild
npm run build
npx cap sync android

# Check if google-services.json is correct
cat android/app/google-services.json
```
