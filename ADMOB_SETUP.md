# Google AdMob Integration Setup Guide

## Important: AdMob vs Web Advertising

**CRITICAL NOTE**: Google AdMob is designed for **mobile applications only** (Android/iOS). For web applications, you must use **Google Ad Manager** with Google Publisher Tag (GPT).

This application uses **Google Publisher Tag (GPT)** for web-based advertising, which supports:
- Banner ads
- Rewarded video ads (mobile-optimized pages only)

## Setup Instructions

### 1. Create Google Ad Manager Account
1. Go to https://admanager.google.com/
2. Sign up or log in with your Google account
3. Complete account setup

### 2. Create Ad Units

#### Banner Ad Unit
1. In Ad Manager, go to **Inventory** > **Ad units**
2. Click **New ad unit**
3. Name: "Dart Miner Banner"
4. Size: 320x50 (mobile banner)
5. Save and note the **Ad unit path** (e.g., `/6355419/dart-miner-banner`)

#### Rewarded Ad Unit
1. Create another ad unit
2. Name: "Dart Miner Rewarded"
3. Type: **Rewarded**
4. Save and note the **Ad unit path**

### 3. Update Configuration

Edit `src/services/adService.ts`:

```typescript
export const AD_CONFIG = {
  NETWORK_CODE: '/YOUR_NETWORK_CODE',  // Replace with your network code
  BANNER_AD_UNIT: '/YOUR_NETWORK_CODE/dart-miner-banner',
  REWARDED_AD_UNIT: '/YOUR_NETWORK_CODE/dart-miner-rewarded',
  TEST_MODE: false  // Set to false for production
};
```

### 4. Policy Compliance

**IMPORTANT**: Ensure compliance with Google Ad Manager policies:

✅ **DO:**
- Clearly label in-app currency as non-transferable
- State that Dart coins have no real-world value
- Include privacy policy explaining ad usage
- Use rewarded ads as opt-in only

❌ **DON'T:**
- Promise cash, gift cards, or cryptocurrency
- Claim Dart coins are redeemable for real money
- Force users to watch ads
- Misrepresent ad rewards

### 5. Privacy Policy Requirements

Update your privacy policy to include:
- Ad serving through Google Ad Manager
- Data collection by Google for ad personalization
- User consent mechanisms
- Link to Google's privacy policy

### 6. Testing

**Test Mode** (current setting):
- Uses placeholder ad unit IDs
- Ads may not display or use test ads
- No real revenue generated

**Production Mode**:
1. Set `TEST_MODE: false` in `adService.ts`
2. Replace all placeholder IDs with real ad unit paths
3. Test on mobile devices for rewarded ads
4. Verify ad loading and reward callbacks

### 7. Rewarded Ad Requirements

Rewarded ads only work on **mobile-optimized pages**:
- Viewport meta tag: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Mobile-responsive design
- Tested on actual mobile devices

### 8. Troubleshooting

**Ads not showing:**
- Check browser console for GPT errors
- Verify ad unit paths are correct
- Ensure network code matches your account
- Test on mobile device for rewarded ads

**Rewards not granted:**
- Check `onRewardGranted` callback is firing
- Verify ad completed successfully
- Check browser console for errors

## Alternative: AdSense for Simple Display Ads

If you only need basic display ads (no rewarded):
1. Use Google AdSense instead: https://adsense.google.com/
2. AdSense is simpler but doesn't support rewarded ads
3. Replace GPT implementation with AdSense ad code

## Support Resources

- Google Ad Manager Help: https://support.google.com/admanager
- GPT Documentation: https://developers.google.com/publisher-tag
- Rewarded Ads Guide: https://developers.google.com/publisher-tag/samples/display-rewarded-ad
