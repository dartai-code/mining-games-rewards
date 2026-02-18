# Keystore Information

## ⚠️ SECURITY WARNING

**This keystore and its password are currently committed to the repository and publicly exposed.**

If this repository is public or if the keystore is used for production releases on Google Play Store, this is a critical security issue. The keystore should be:
1. Removed from version control immediately
2. A new keystore should be generated for production use
3. Passwords should be stored securely (environment variables, CI/CD secrets, password managers)

---

## Current Keystore Details

**Keystore File Location:**
```
android/keystore.jks
```

**Keystore Credentials:**
- **Password:** `Rajat#1994`
- **Key Alias:** `key0`

**File Size:** 2.3 KB

**Note:** These credentials are also documented in [GOOGLE_SIGNIN_FIX.md](GOOGLE_SIGNIN_FIX.md).

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

## Security Best Practices

⚠️ **IMPORTANT:**
- **Never commit keystore files to version control** (this keystore is already committed - see warning above)
- **Keep passwords secure and private** (the password in this file is already exposed in the repository)
- **Use environment variables or CI/CD secrets for passwords in production**
- **Back up the keystore file in a secure, encrypted location**
- If the keystore is lost, you cannot update the app on Google Play Store
- **For production apps, generate a new keystore and keep it secure**

---

## Backup Information

Make sure to backup the following:
1. The keystore file: `android/keystore.jks`
2. The password: `Rajat#1994`
3. The key alias: `key0`

Store these in a secure location (password manager, encrypted storage, etc.)
