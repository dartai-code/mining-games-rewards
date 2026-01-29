# Dart AI Website - Deployment Guide

## 📋 Overview
Complete website for Dart AI with landing page, live stats, roadmap, and testimonials.

## 🎯 Current Status
**Website files are READY but NOT ACTIVE**
- All components created and saved
- No impact on existing app functionality
- Safe to continue app development

## 📁 Website Files Created

### Pages
- `src/pages/LandingPage.tsx` - Main landing page with hero, features, CTA

### Components
- `src/components/LiveStatsSection.tsx` - Real-time player statistics from Firebase
- `src/components/RoadmapSection.tsx` - Product roadmap timeline
- `src/components/TestimonialsSection.tsx` - Player testimonials & app screenshots

### Configuration
- `src/config/website.ts` - Website settings (Play Store links, social media)
- `src/App.WEBSITE_READY.tsx` - New App.tsx with hybrid routing (ready to activate)
- `firebase.json` - Firebase Hosting configuration

## 🚀 How to Activate Website

### Step 1: Update Configuration
Edit `src/config/website.ts`:
```typescript
playStoreUrl: 'YOUR_ACTUAL_PLAY_STORE_LINK',
social: {
  discord: 'YOUR_DISCORD_LINK',
  twitter: 'YOUR_TWITTER_LINK',
  telegram: 'YOUR_TELEGRAM_LINK',
}
```

### Step 2: Enable Hybrid Routing
Replace `src/App.tsx` with `src/App.WEBSITE_READY.tsx`:
```bash
# Backup current App.tsx
cp src/App.tsx src/App.BACKUP.tsx

# Activate website version
cp src/App.WEBSITE_READY.tsx src/App.tsx
```

### Step 3: Test Locally
```bash
npm run dev
```
- Visit `http://localhost:5173/` - Should show landing page (guest view)
- Login - Should redirect to `/app` (user view)

### Step 4: Build for Production
```bash
npm run build
```

### Step 5: Deploy to Firebase Hosting
```bash
# Install Firebase CLI if not installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase Hosting (first time only)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

## 🎨 Website Features

### For Guests (Not Logged In)
✅ Hero section with app download CTA
✅ Feature showcase
✅ Live statistics dashboard
✅ How it works (3 steps)
✅ App screenshots
✅ Player testimonials
✅ Product roadmap
✅ Social media links
✅ Footer with legal links

### For Logged-In Users
✅ Automatic redirect to `/app`
✅ Full game functionality
✅ Access to all app features

## 🔧 Customization

### Update Social Links
Edit `src/config/website.ts`

### Update Roadmap Items
Edit `src/components/RoadmapSection.tsx`

### Update Testimonials
Edit `src/components/TestimonialsSection.tsx`

### Modify Branding
Edit `src/pages/LandingPage.tsx` - Update colors, text, CTAs

## 📊 Live Stats Integration

The `LiveStatsSection` component automatically fetches:
- Total players from Firebase
- Total rewards distributed
- Active players (24h)
- Top 5 leaderboard

Falls back to demo data if Firebase query fails.

## 🌐 Alternative Deployment Options

### Vercel (Recommended for simplicity)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

## 🔒 Security Notes
- All Firebase queries use client-side SDK (safe for public)
- User data is protected by Firebase security rules
- No sensitive information exposed in website

## ✅ Pre-Launch Checklist
- [ ] Update Play Store link in `website.ts`
- [ ] Add social media links in `website.ts`
- [ ] Test website in guest mode
- [ ] Test app in logged-in mode
- [ ] Verify Firebase stats are loading
- [ ] Check mobile responsiveness
- [ ] Review all CTAs and links
- [ ] Deploy to hosting

## 🆘 Troubleshooting

### Website not showing for guests
- Check `App.tsx` is using the WEBSITE_READY version
- Verify `PublicRoute` component is working
- Clear browser cache

### Stats not loading
- Check Firebase connection in `src/config/firebase.ts`
- Verify Firestore collection names match (`users`)
- Check browser console for errors

### App not working for logged-in users
- Verify `ProtectedRoute` component
- Check authentication flow in AuthGuard
- Test login/logout functionality

## 📞 Support
For issues, check:
1. Browser console for errors
2. Firebase configuration
3. Network tab for failed requests
