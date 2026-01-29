import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Gamepad2, 
  Coins, 
  Trophy, 
  Users, 
  Zap, 
  Shield,
  Download,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RoadmapSection from '@/components/RoadmapSection';
import LiveStatsSection from '@/components/LiveStatsSection';
import TestimonialsSection from '@/components/TestimonialsSection';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Gamepad2 className="w-8 h-8 text-purple-500" />,
      title: 'Play Fun Games',
      description: 'Enjoy exciting mini-games like Jump Climb and Stack Tower while earning rewards'
    },
    {
      icon: <Coins className="w-8 h-8 text-green-500" />,
      title: 'Mine & Earn',
      description: 'Automatic mining system that generates rewards even when you\'re not playing'
    },
    {
      icon: <Trophy className="w-8 h-8 text-yellow-500" />,
      title: 'Compete & Win',
      description: 'Climb the leaderboards and compete with players worldwide for top rewards'
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: 'Refer Friends',
      description: 'Invite friends and earn bonus rewards for every successful referral'
    },
    {
      icon: <Zap className="w-8 h-8 text-orange-500" />,
      title: 'Instant Rewards',
      description: 'Complete tasks and watch ads to earn instant rewards and boost your mining'
    },
    {
      icon: <Shield className="w-8 h-8 text-cyan-500" />,
      title: 'Secure & Safe',
      description: 'Your data and rewards are protected with enterprise-grade security'
    }
  ];

  const stats = [
    { label: 'Active Players', value: '10,000+' },
    { label: 'Rewards Distributed', value: '$50,000+' },
    { label: 'Games Played', value: '1M+' },
    { label: 'Countries', value: '150+' }
  ];

  const handleLogin = () => {
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-purple-500" />
            <div>
              <h1 className="text-xl font-bold text-white">Dart AI</h1>
              <p className="text-xs text-gray-400">Studios</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white"
              onClick={() => document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Roadmap
            </Button>
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white"
              onClick={() => document.getElementById('stats')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Stats
            </Button>
            <Button
              onClick={handleLogin}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <span className="text-purple-400 text-sm font-medium">🎮 Play • Mine • Earn</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Turn Your Gaming
            <br />
            Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-green-500">Real Rewards</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of players earning cryptocurrency by playing fun games, 
            completing tasks, and building their mining empire.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-6 text-lg"
              onClick={() => window.open('#', '_blank')} // Placeholder for Play Store link
            >
              <Download className="w-5 h-5 mr-2" />
              Download on Play Store
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800 px-8 py-6 text-lg"
              onClick={handleLogin}
            >
              Open Web App
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="py-16 px-4 bg-gray-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose Dart AI?
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to start earning while gaming
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all">
                <CardContent className="p-6">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-400">
              Start earning in three simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 border border-purple-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-500">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Download & Sign Up</h3>
              <p className="text-gray-400">Get the app from Play Store and create your free account</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-500">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Play & Mine</h3>
              <p className="text-gray-400">Enjoy games, complete tasks, and let your miner run automatically</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 border border-yellow-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-yellow-500">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Earn Rewards</h3>
              <p className="text-gray-400">Accumulate points and convert them to real cryptocurrency</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Section */}
      <LiveStatsSection />

      {/* Testimonials & Screenshots */}
      <TestimonialsSection />

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-r from-purple-900/50 to-green-900/50 border-purple-500/50">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Start Earning?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of players who are already earning rewards
              </p>
              <Button
                size="lg"
                className="bg-white text-purple-900 hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
                onClick={() => window.open('#', '_blank')} // Placeholder for Play Store link
              >
                <Download className="w-5 h-5 mr-2" />
                Download Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Roadmap Section */}
      <RoadmapSection />

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-500" />
                <span className="font-bold text-white">Dart AI Studios</span>
              </div>
              <p className="text-gray-400 text-sm">
                Play, mine, and earn cryptocurrency through fun games and tasks.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#roadmap" className="hover:text-white">Roadmap</a></li>
                <li><a href="#stats" className="hover:text-white">Stats</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/privacy-policy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Discord (Coming Soon)</a></li>
                <li><a href="#" className="hover:text-white">Twitter (Coming Soon)</a></li>
                <li><a href="#" className="hover:text-white">Telegram (Coming Soon)</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>&copy; 2026 Dart AI Studios. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
