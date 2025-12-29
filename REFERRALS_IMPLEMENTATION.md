# Referrals Tab Implementation Guide

## Overview
Complete implementation of the Referrals Tracking system with monthly leaderboards, user stats, and Firebase integration.

## Files Created/Modified

### ✅ New Files Created

1. **src/components/ReferralsTab.tsx** (270 lines)
   - Main referrals tab component with leaderboards
   - Features:
     - My Referral Code section with copy/share buttons
     - Stats cards: Total Referrals, Active Users, DART Earned
     - Tabbed leaderboard: Current Month, Last Month, All-Time, History
     - Trophy icons for top 3 (🏆🥈🥉)
     - Monthly reset indicator
     - Full usernames displayed

2. **src/hooks/useReferrals.ts** (161 lines)
   - Custom React hook for referral data management
   - Features:
     - Load user's referral stats from Firebase
     - Load all leaderboard data (current/last/all-time/history)
     - Generate referral code (6-character alphanumeric)
     - Copy referral code to clipboard
     - Share referral link via native share API
     - Fallback to localStorage for non-authenticated users

### ✅ Files Modified

3. **src/services/firebaseStorageService.ts**
   - Added methods:
     - `getReferralStats(uid)` - Get user's total referrals, active users, and activity bonus
     - `getReferralLeaderboard(period)` - Get top 10 for current/last/all-time
     - `getReferralHistory()` - Get historical monthly leaderboards
     - `recordReferralInstall(inviterCode, newUserId)` - Track successful install (3+ min)

4. **src/components/BottomNavigation.tsx**
   - Added "Referrals" tab with Users icon
   - New tab order: Home → Games → Referrals → Tasks → Wallet → Leaders

5. **src/components/AppLayout.tsx**
   - Imported ReferralsTab component
   - Added 'referrals' case to renderTab() switch

## Features Implemented

### 📊 Personal Stats Dashboard
- **Total Referrals**: All-time count of successful installs (3+ minute engagement)
- **Active Users**: Users who played in last 30 days
- **DART Earned**: `(Total Referrals × 50) + 5% activity bonus`

### 🏆 Leaderboard System

#### Current Month Tab
- Top 10 referrers for ongoing month
- Shows: January 2025
- Badge: "Resets on 1st"
- Rankings reset automatically on 1st of each month

#### Last Month Tab
- Top 10 from previous month (December 2024)
- Preserved historical data

#### All-Time Tab
- Lifetime top 10 referrers
- Cumulative totals never reset

#### History Tab
- Dropdown to select any past month
- View historical monthly rankings
- Example: November 2024, October 2024, etc.

### 💎 Visual Features
- Trophy icons for top 3: 🏆 (1st), 🥈 (2nd), 🥉 (3rd)
- Gradient backgrounds for top 3 (yellow-orange glow)
- Full usernames displayed (not truncated)
- Referral counts shown below username
- Copy/Share buttons with native functionality
- Responsive grid layout for stat cards

## Firebase Data Structure

### Collections

#### `users` collection
```typescript
{
  uid: string,
  username: string,
  referralCode: string,        // "ABC123" - user's unique code
  inviterCode?: string,         // Code of person who invited them
  referralCount: number,        // How many they referred
  totalBalance: number,
  updatedAt: Timestamp
}
```

#### `referralLeaderboard` collection
```typescript
{
  userId: string,
  username: string,
  period: string,              // "2025-01" or "alltime"
  referrals: number,           // Count for this period
  timestamp: Timestamp
}
```

## How It Works

### Referral Flow

1. **User A gets referral code**: `XYZ789`
2. **User A shares code** via copy/share button
3. **User B installs app** with code `XYZ789`
4. **User B plays for 3+ minutes** (tracked separately)
5. **System calls**: `firebaseStorage.recordReferralInstall('XYZ789', userBId)`
6. **User A receives**:
   - 50 DART instantly
   - Entry added to transaction history
   - Referral count +1
   - Leaderboard updated

### Monthly Reset Logic

**January 1st, 2025 at 00:00**:
- Current Month (December) → archived to History
- Last Month becomes December
- Current Month becomes empty January
- All-Time totals remain unchanged

**User personal stats**:
- Total Referrals: Cumulative (never reset)
- Active Users: Rolling 30-day window
- DART Earned: Cumulative (never reset)

## Usage Instructions

### For Users

1. Navigate to **Referrals** tab in bottom navigation
2. Copy referral code or share link
3. Share with friends via social media, messaging, etc.
4. View your stats in real-time
5. Check your ranking in leaderboards
6. Explore history to see past months

### For Developers

#### Track Referral Install
```typescript
// When user spends 3+ minutes playing
await firebaseStorage.recordReferralInstall(
  inviterCode,  // Code from URL param or user input
  newUserId     // Current authenticated user ID
);
```

#### Get User Stats
```typescript
const { useReferrals } = require('@/hooks/useReferrals');

const {
  myStats,                    // { referralCode, totalReferrals, activeUsers, totalEarned }
  currentMonthLeaderboard,    // Top 10 for current month
  lastMonthLeaderboard,       // Top 10 for last month
  allTimeLeaderboard,         // Top 10 all-time
  monthlyHistory,             // Array of past months with leaderboards
  loading,                    // Loading state
  copyReferralCode,           // Function to copy code
  shareReferralLink,          // Function to share via native API
  refreshData                 // Reload all data
} = useReferrals();
```

## Rewards System

### Automatic Rewards (In-App)
- ✅ 50 DART per successful install
- ✅ 5% bonus from referral's lifetime activity
- ✅ Added to user's wallet instantly
- ✅ Transaction recorded in history

### Manual Rewards (Top 10)
- ❌ NOT automated in-app
- ❌ Handled privately via Telegram
- Admin manually sends rewards to top performers each month

## Testing Checklist

- [ ] Tab appears in bottom navigation
- [ ] Referral code generates on first load
- [ ] Copy button copies to clipboard
- [ ] Share button opens native share dialog (mobile)
- [ ] Stats load from Firebase
- [ ] Leaderboard tabs switch correctly
- [ ] History dropdown populates with months
- [ ] Top 3 show trophy icons
- [ ] Monthly reset occurs on 1st (test with mock date)
- [ ] All-time totals accumulate correctly

## Future Enhancements

1. **Real-time updates**: Use Firestore listeners instead of manual refresh
2. **Push notifications**: Alert user when they earn referral reward
3. **Referral analytics**: Track conversion rates, source attribution
4. **Social share images**: Auto-generate shareable graphics
5. **Invite via SMS/Email**: Direct integrations
6. **Referral tiers**: Bronze/Silver/Gold based on count
7. **Bonus challenges**: Extra rewards for milestones (10, 50, 100 referrals)

## Notes

- Leaderboard shows only top 10 (requirement: display top 10)
- User's own rank not highlighted unless in top 10
- Works offline with localStorage fallback
- Requires Firebase authentication to persist data
- Compatible with existing user setup flow
- Mobile-optimized with responsive design

## Migration Path

### Current State
- App uses localStorage for all data
- No cloud backup or sync
- Basic transaction tracking

### After Firebase Migration
1. Users sign in (anonymous or Google)
2. Local data synced to Firebase
3. Referral tracking enabled
4. Leaderboards populate automatically
5. Cross-device sync enabled

---

**Status**: ✅ Complete and ready for testing  
**Dependencies**: Firebase SDK, UI components (Tabs, Select, Card, Button)  
**Next Step**: Test in development, then discuss Influencer Dashboard
