# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "mining-games-rewards")
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Register Your App

1. In Firebase Console, click the **Web** icon (</>) to add a web app
2. Enter app nickname (e.g., "Mining Games Web")
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. **Copy the Firebase configuration** object

## Step 3: Configure Environment Variables

1. Create a `.env` file in your project root (copy from `.env.example`)
2. Paste your Firebase config values:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

3. **Add `.env` to your `.gitignore`** (IMPORTANT - don't commit this file!)

## Step 4: Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable sign-in methods:
   - **Anonymous** - For users who don't want to sign up
   - **Google** - For Google sign-in

## Step 5: Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Choose **Production mode** for now (we'll add rules later)
4. Select your preferred location
5. Click "Enable"

## Step 6: Configure Firestore Security Rules

In Firestore, go to **Rules** tab and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own transactions
    match /transactions/{transactionId} {
      allow read: if request.auth != null && resource.data.uid == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
    }
    
    // Anyone can read leaderboard
    match /leaderboard/{entryId} {
      allow read: if true;
      allow create: if request.auth != null;
    }
  }
}
```

## Step 7: Create Firestore Indexes

In Firestore, go to **Indexes** tab and create these composite indexes:

1. **Transactions Index**:
   - Collection: `transactions`
   - Fields: `uid` (Ascending), `timestamp` (Descending)

2. **Leaderboard Index**:
   - Collection: `leaderboard`
   - Fields: `game` (Ascending), `period` (Ascending), `score` (Descending)

## Step 8: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. The app will automatically prompt users to sign in
3. Test anonymous sign-in
4. Test Google sign-in
5. Check Firestore Console to see data being created

## Step 9: Data Migration (Optional)

To migrate existing localStorage data to Firebase:

1. Users will need to sign in
2. Their local data will be automatically synced to Firebase
3. You can create a migration script if needed

## Firestore Collections Structure

### `users` Collection
```javascript
{
  uid: "user-id",
  username: "Player123",
  country: "US",
  totalBalance: 1000,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  miningSession: {
    startTime: 1234567890,
    endTime: 1234567890,
    isActive: true
  },
  match3Progress: {
    currentLevel: 5,
    completedLevels: [1, 2, 3, 4],
    stars: { 1: 3, 2: 2, 3: 3 },
    lives: 5,
    lastLifeUpdate: 1234567890
  },
  bullseyeProgress: {
    currentLevel: 10,
    highScore: 5000
  },
  referralCode: "ABC123",
  inviterCode: "XYZ789",
  referralCount: 5
}
```

### `transactions` Collection
```javascript
{
  id: "transaction-id",
  uid: "user-id",
  type: "Mining",
  amount: 100,
  timestamp: Timestamp,
  note: "24-hour mining session",
  game: "match3"
}
```

### `leaderboard` Collection
```javascript
{
  uid: "user-id",
  username: "Player123",
  country: "US",
  score: 5000,
  game: "bullseye",
  period: "daily",
  timestamp: Timestamp
}
```

## Troubleshooting

### "Permission denied" errors
- Check Firestore security rules
- Ensure user is authenticated
- Verify the user owns the document they're trying to access

### "Missing or insufficient permissions"
- Go to Firestore rules and ensure they're published
- Make sure authentication is enabled

### Environment variables not working
- Restart dev server after changing `.env`
- Ensure variables start with `VITE_`
- Check `.env` file is in project root

### Authentication not working
- Enable authentication methods in Firebase Console
- For Google sign-in, add your domain to authorized domains

## Next Steps

- Set up Firebase Cloud Functions for backend logic
- Add Firebase Cloud Messaging for push notifications
- Implement Firebase Remote Config for feature flags
- Add Firebase Performance Monitoring
- Set up Firebase Crashlytics for error tracking

## Support

For issues, check:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
