# Keystore Information

## Current Keystore Details

**Keystore File Location:**
```
android/keystore.jks
```

**Keystore Credentials:**
- **Password:** `Rajat#1994`
- **Key Alias:** `key0`

**File Size:** 2.3 KB

---

## How to Use the Keystore

### 1. View Keystore Information

To view the SHA-1 fingerprint and other keystore details:

```bash
keytool -list -v -keystore android/keystore.jks -alias key0
```

Enter password when prompted: `Rajat#1994`

### 2. Sign an APK

To manually sign an APK with this keystore:

```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore android/keystore.jks \
  android/app/build/outputs/apk/release/app-release.apk \
  key0
```

Enter password when prompted: `Rajat#1994`

### 3. Verify APK Signature

To verify an APK is signed with this keystore:

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

---

## Firebase Configuration

This keystore is used for Google Sign-In on Android. The SHA-1 fingerprint from this keystore needs to be registered in Firebase Console.

For detailed setup instructions, see:
- [GOOGLE_SIGNIN_FIX.md](GOOGLE_SIGNIN_FIX.md)
- [BUILD_ANDROID.md](BUILD_ANDROID.md)

---

## Security Notes

⚠️ **IMPORTANT:**
- **Never commit this keystore file to public repositories**
- **Keep the password secure and private**
- **Back up the keystore file in a secure location**
- If the keystore is lost, you cannot update the app on Google Play Store

---

## Backup Information

Make sure to backup the following:
1. The keystore file: `android/keystore.jks`
2. The password: `Rajat#1994`
3. The key alias: `key0`

Store these in a secure location (password manager, encrypted storage, etc.)
