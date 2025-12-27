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
      appId: 'ca-app-pub-5844068054295246~2712349629',
      bannerAdId: 'ca-app-pub-5844068054295246/6013440009',
      interstitialAdId: 'ca-app-pub-5844068054295246/9714648346',
      rewardedAdId: 'ca-app-pub-5844068054295246/3209247149'
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
