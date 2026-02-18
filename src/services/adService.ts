// AdMob Service for Capacitor Android App
// Production AdMob IDs
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  RewardAdOptions,
  AdMobRewardItem,
  InterstitialAdOptions
} from '@capacitor-community/admob';

export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-7556351842925138~3225925254',
  BANNER_AD_UNIT: 'ca-app-pub-7556351842925138/3633119361',
  REWARDED_AD_UNIT: 'ca-app-pub-7556351842925138/8749714676',
  INTERSTITIAL_AD_UNIT: 'ca-app-pub-7556351842925138/5922670540',
  TEST_MODE: false // set true for test ads during QA
};

export interface RewardedAdCallbacks {
  onReady?: () => void;
  onGranted?: (reward: { type: string; amount: number }) => void;
  onClosed?: () => void;
  onError?: (error: string) => void;
}

class AdService {
  private initialized = false;
  private bannerVisible = false;

  private isNativeAdMobAvailable() {
    // Capacitor AdMob exists only on native; on web we simulate
    return typeof (AdMob as any)?.initialize === 'function';
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (!this.isNativeAdMobAvailable()) {
      console.log('AdMob not available (web/testing).');
      return;
    }
    try {
      await AdMob.initialize({
        requestTrackingAuthorization: false,
        testingDevices: [],
        initializeForTesting: ADMOB_CONFIG.TEST_MODE
      });
      this.initialized = true;
    } catch (e) {
      console.log('AdMob init error:', e);
    }
  }

  async showBanner(): Promise<void> {
    if (this.bannerVisible) return;

    if (!this.isNativeAdMobAvailable()) {
      // simulate on web: pretend loaded so UI placeholder clears
      this.bannerVisible = true;
      return;
    }

    try {
      await this.initialize();
      await AdMob.showBanner({
        adId: ADMOB_CONFIG.BANNER_AD_UNIT,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        // Add margin to avoid overlapping bottom nav/tabs
        margin: 60,
        isTesting: ADMOB_CONFIG.TEST_MODE
      });
      this.bannerVisible = true;
    } catch (e) {
      console.log('Banner error:', e);
    }
  }

  async hideBanner(): Promise<void> {
    if (!this.bannerVisible) return;
    if (!this.isNativeAdMobAvailable()) {
      this.bannerVisible = false;
      return;
    }
    try {
      await AdMob.hideBanner();
      this.bannerVisible = false;
    } catch (e) {
      console.log('Hide banner error:', e);
    }
  }

  async loadRewardedAd(callbacks: RewardedAdCallbacks): Promise<void> {
    if (!this.isNativeAdMobAvailable()) {
      // simulate load success on web/testing
      setTimeout(() => callbacks.onReady?.(), 300);
      return;
    }

    try {
      await this.initialize();
      const options: RewardAdOptions = {
        adId: ADMOB_CONFIG.REWARDED_AD_UNIT,
        isTesting: ADMOB_CONFIG.TEST_MODE
      };
      await AdMob.prepareRewardAd(options);
      callbacks.onReady?.();
    } catch (e) {
      console.log('Reward load error:', e);
      callbacks.onError?.('Failed to load ad');
    }
  }

  async showRewardedAd(callbacks: RewardedAdCallbacks): Promise<void> {
    if (!this.isNativeAdMobAvailable()) {
      // simulate reward on web/testing
      callbacks.onGranted?.({ type: 'reward', amount: 1 });
      callbacks.onClosed?.();
      return;
    }

    let rewardListener: any;
    let closeListener: any;
    let failToShowListener: any;

    try {
      // Reward listener
      rewardListener = AdMob.addListener('onRewarded', (reward: AdMobRewardItem) => {
        callbacks.onGranted?.({ type: reward.type, amount: reward.amount });
      });

      // Closed listener
      closeListener = AdMob.addListener('onAdDismissedFullScreenContent', () => {
        callbacks.onClosed?.();
        this.removeListeners([rewardListener, closeListener, failToShowListener]);
      });

      failToShowListener = AdMob.addListener('onAdFailedToPresentFullScreenContent', (err) => {
        console.log('Reward show failed:', err);
        callbacks.onError?.('Ad failed to show');
        callbacks.onClosed?.();
        this.removeListeners([rewardListener, closeListener, failToShowListener]);
      });

      await AdMob.showRewardAd();
    } catch (e) {
      console.log('Reward show error:', e);
      callbacks.onError?.('Ad failed to show');
      callbacks.onClosed?.();
      this.removeListeners([rewardListener, closeListener, failToShowListener]);
    }
  }

  async showInterstitial(): Promise<void> {
    if (!this.isNativeAdMobAvailable()) {
      return;
    }
    try {
      await this.initialize();
      const options: InterstitialAdOptions = {
        adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT,
        isTesting: ADMOB_CONFIG.TEST_MODE
      };
      await AdMob.prepareInterstitial(options);
      await AdMob.showInterstitial();
    } catch (e) {
      console.log('Interstitial error:', e);
    }
  }

  private removeListeners(listeners: any[]) {
    listeners.forEach(l => {
      try { l?.remove(); } catch {}
    });
  }
}

export const adService = new AdService();
