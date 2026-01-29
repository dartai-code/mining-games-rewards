import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Quote } from 'lucide-react';

export default function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Alex Johnson',
      role: 'Active Player',
      avatar: '👨',
      rating: 5,
      text: 'Been playing for 2 months and already earned $150! The games are fun and the mining system runs smoothly. Highly recommend!'
    },
    {
      name: 'Sarah Miller',
      role: 'Top Earner',
      avatar: '👩',
      rating: 5,
      text: 'Love the referral system! I invited my friends and we all earn together. The leaderboard competitions keep things exciting.'
    },
    {
      name: 'Mike Chen',
      role: 'Daily Player',
      avatar: '👨',
      rating: 5,
      text: 'Simple, fun, and actually pays! The games are addictive and watching ads for bonus rewards is totally worth it.'
    }
  ];

  const screenshots = [
    {
      title: 'Mining Dashboard',
      description: 'Track your earnings in real-time',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Fun Mini-Games',
      description: 'Play Jump Climb and Stack Tower',
      color: 'from-green-500 to-teal-500'
    },
    {
      title: 'Leaderboards',
      description: 'Compete with players worldwide',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      title: 'Wallet & Rewards',
      description: 'Manage your crypto earnings',
      color: 'from-blue-500 to-cyan-500'
    }
  ];

  return (
    <>
      {/* Screenshots Section */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Experience Dart AI
            </h2>
            <p className="text-xl text-gray-400">
              A glimpse into your earning journey
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {screenshots.map((screenshot, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 overflow-hidden group hover:border-purple-500/50 transition-all">
                <div className={`h-48 bg-gradient-to-br ${screenshot.color} relative`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl">📱</div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-white mb-1">{screenshot.title}</h3>
                  <p className="text-sm text-gray-400">{screenshot.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What Players Say
            </h2>
            <p className="text-xl text-gray-400">
              Join thousands of happy earners
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all">
                <CardContent className="p-6">
                  <Quote className="w-10 h-10 text-purple-500/30 mb-4" />
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Benefits */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to Succeed
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Instant Withdrawals</h3>
                  <p className="text-gray-400">Transfer your earnings to your wallet anytime with fast processing</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎮</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Multiple Games</h3>
                  <p className="text-gray-400">Choose from various mini-games, each with unique rewards and challenges</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Real-time Analytics</h3>
                  <p className="text-gray-400">Track your earnings, mining rate, and performance with detailed stats</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Secure & Private</h3>
                  <p className="text-gray-400">Your data and earnings are protected with enterprise-grade security</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Active Community</h3>
                  <p className="text-gray-400">Join our Discord and connect with thousands of players worldwide</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎁</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Daily Rewards</h3>
                  <p className="text-gray-400">Complete daily tasks and challenges for bonus rewards and multipliers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
