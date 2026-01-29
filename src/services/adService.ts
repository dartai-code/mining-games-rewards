// AdMob Service for Capacitor Android App
// Production AdMob IDs

export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-5844068054295246~2712349629',
  BANNER_AD_UNIT: 'ca-app-pub-5844068054295246/6013440009',
  REWARDED_AD_UNIT: 'ca-app-pub-5844068054295246/3209247149',
  INTERSTITIAL_AD_UNIT: 'ca-app-pub-5844068054295246/9714648346',
  TEST_MODE: false
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

  async initialize(): Promise<void> {
    if (this.initialized) return;
    try {
      // @ts-expect-error - Capacitor AdMob plugin
      if (window.AdMob) {
        // @ts-expect-error
        await window.AdMob.initialize({ testingDevices: [], initializeForTesting: false });
        this.initialized = true;
      }
    } catch (e) { console.log('AdMob init:', e); }
  }

  async showBanner(): Promise<void> {
    if (this.bannerVisible) return;
    try {
      await this.initialize();
      // @ts-expect-error
      if (window.AdMob) {
        // @ts-expect-error
        await window.AdMob.showBanner({ adId: ADMOB_CONFIG.BANNER_AD_UNIT, position: 'bottom', margin: 60 });
        this.bannerVisible = true;
      }
    } catch (e) { console.log('Banner:', e); }
  }

  async hideBanner(): Promise<void> {
    if (!this.bannerVisible) return;
    try {
      // @ts-expect-error
      if (window.AdMob) { await window.AdMob.hideBanner(); }
      this.bannerVisible = false;
    } catch (e) {}
  }

  async loadRewardedAd(callbacks: RewardedAdCallbacks): Promise<void> {
    try {
      await this.initialize();
      // @ts-expect-error
      if (window.AdMob) {
        // @ts-expect-error
        await window.AdMob.prepareRewardVideoAd({ adId: ADMOB_CONFIG.REWARDED_AD_UNIT });
      }
      callbacks.onReady?.();
    } catch (e) { 
      // Fallback for web/testing
      setTimeout(() => callbacks.onReady?.(), 500);
    }
  }

  async showRewardedAd(callbacks: RewardedAdCallbacks): Promise<void> {
    try {
      // @ts-expect-error
      if (window.AdMob) {
        // @ts-expect-error
        await window.AdMob.showRewardVideoAd();
      }
      callbacks.onGranted?.({ type: 'reward', amount: 1 });
      callbacks.onClosed?.();
    } catch (e) {
      callbacks.onGranted?.({ type: 'reward', amount: 1 });
      callbacks.onClosed?.();
    }
  }

  async showInterstitial(): Promise<void> {
    try {
      await this.initialize();
      // @ts-expect-error
      if (window.AdMob) {
        // @ts-expect-error
        await window.AdMob.prepareInterstitial({ adId: ADMOB_CONFIG.INTERSTITIAL_AD_UNIT });
        // @ts-expect-error
        await window.AdMob.showInterstitial();
      }
    } catch (e) {}
  }
}

export const adService = new AdService();
