// Website Configuration
// Update these values when you have your Play Store link and social media

export const WEBSITE_CONFIG = {
  // App Info
  appName: 'Dart AI',
  companyName: 'Dart AI Studios',
  tagline: 'Turn Your Gaming Into Real Rewards',
  description: 'Join thousands of players earning cryptocurrency by playing fun games, completing tasks, and building their mining empire.',

  // Links (Update these when available)
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.dartai.miner', // Replace with actual link
  
  // Social Media (Update these when available)
  social: {
    discord: '#', // Replace with actual Discord invite link
    twitter: '#', // Replace with actual Twitter/X profile
    telegram: '#', // Replace with actual Telegram group link
    website: 'https://dartai.com', // Replace with actual website
  },

  // Contact
  supportEmail: 'support@dartai.com', // Replace with actual email
  
  // Stats Display (Will be replaced with real data from Firebase)
  demoStats: {
    totalPlayers: 10547,
    totalRewards: 52384,
    activePlayers24h: 3241,
  },

  // Feature flags
  features: {
    showLiveStats: true, // Set to false if you want to hide live stats
    showTestimonials: true,
    showRoadmap: true,
    enableSocialLinks: false, // Set to true when social links are ready
  }
};
