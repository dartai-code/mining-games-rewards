# Dart AI - Android Build Guide

## Prerequisites

1. **Node.js** (v18+)
2. **Android Studio** (latest version)
3. **Java JDK 17**
4. **Android SDK** (API 33+)

---

## Step 1: Install Dependencies

```bash
npm install
```

---

## Step 2: Build Web App

```bash
npm run build
```

---

## Step 3: Add Android Platform

```bash
npx cap add android
npx cap sync
```

---

## Step 4: Configure AdMob in AndroidManifest.xml

Open `android/app/src/main/AndroidManifest.xml` and add inside `<application>`:

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-5844068054295246~2712349629" />
```

Full example:
```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme">

    <meta-data
        android:name="com.google.android.gms.ads.APPLICATION_ID"
        android:value="ca-app-pub-5844068054295246~2712349629" />

    <!-- ... rest of manifest -->
</application>
```

---

## Step 5: Open in Android Studio

```bash
npx cap open android
```

---

## Step 6: Build Debug APK

In Android Studio:
1. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. Wait for build to complete
3. Find APK at: `android/app/build/outputs/apk/debug/app-debug.apk`
4. Rename to: `DartAI_debug_v1.apk`

---

## Step 7: Build Release AAB

### 7.1 Create Keystore (first time only)

```bash
keytool -genkey -v -keystore dart-ai-release.keystore -alias dart-ai -keyalg RSA -keysize 2048 -validity 10000
```

### 7.2 Configure Signing

Create `android/app/keystore.properties`:
```
storeFile=../dart-ai-release.keystore
storePassword=YOUR_PASSWORD
keyAlias=dart-ai
keyPassword=YOUR_PASSWORD
```

### 7.3 Update build.gradle

In `android/app/build.gradle`, add:

```gradle
def keystorePropertiesFile = rootProject.file("app/keystore.properties")
def keystoreProperties = new Properties()
keystoreProperties.load(new FileInputStream(keystorePropertiesFile))

android {
    signingConfigs {
        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 7.4 Build AAB

In Android Studio:
1. Go to **Build > Generate Signed Bundle / APK**
2. Select **Android App Bundle**
3. Choose your keystore
4. Select **release** build variant
5. Click **Finish**
6. Find AAB at: `android/app/build/outputs/bundle/release/app-release.aab`
7. Rename to: `DartAI_release_v1.aab`

---

## AdMob Ad Unit IDs (Already Configured)

| Type | Ad Unit ID |
|------|------------|
| Banner | ca-app-pub-5844068054295246/6013440009 |
| Rewarded | ca-app-pub-5844068054295246/3209247149 |
| Interstitial | ca-app-pub-5844068054295246/9714648346 |

---

## Quick Commands

```bash
# Full build and sync
npm run android:build

# Open Android Studio
npm run android:studio

# Sync only
npm run cap:sync
```

---

## Troubleshooting

### AdMob not loading
- Verify APPLICATION_ID in AndroidManifest.xml
- Check internet permissions
- Wait 1-2 hours for new ad units to activate

### Build fails
- Run `npx cap sync` again
- Clean project: Build > Clean Project
- Invalidate caches: File > Invalidate Caches

---

## Google Play Compliance Checklist

- [x] All points are virtual (no real money)
- [x] Disclaimer text on Tasks and Community screens
- [x] No "earn", "crypto", "cash" language
- [x] AdMob properly integrated
- [x] Privacy Policy included
