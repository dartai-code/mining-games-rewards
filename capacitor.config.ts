import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dartai.miner',
  appName: 'Dart AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#030712',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      spinnerColor: '#4ADE80'
    },
    AdMob: {
      appId: 'ca-app-pub-7556351842925138~3225925254',
      bannerAdId: 'ca-app-pub-7556351842925138/3633119361',
      interstitialAdId: 'ca-app-pub-7556351842925138/5922670540',
      rewardedAdId: 'ca-app-pub-7556351842925138/8749714676'
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '839535063372-o1pjt9ejq8nsh6ro9g1o423ctt2d5t1t.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#030712'
  }
};

export default config;
