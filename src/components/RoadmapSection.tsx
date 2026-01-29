import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Circle, 
  Clock,
  Gamepad2,
  Coins,
  Users,
  Wallet,
  Globe,
  Trophy,
  Sparkles,
  Rocket
} from 'lucide-react';

export default function RoadmapSection() {
  const roadmapItems = [
    {
      quarter: 'Q1 2026',
      status: 'completed',
      items: [
        { icon: <Gamepad2 className="w-5 h-5" />, title: 'Launch Core Games', description: 'Jump Climb & Stack Tower released', completed: true },
        { icon: <Coins className="w-5 h-5" />, title: 'Mining System', description: 'Automatic reward mining implemented', completed: true },
        { icon: <Users className="w-5 h-5" />, title: 'Referral Program', description: 'Friend referral system live', completed: true },
      ]
    },
    {
      quarter: 'Q2 2026',
      status: 'in-progress',
      items: [
        { icon: <Trophy className="w-5 h-5" />, title: 'Enhanced Leaderboards', description: 'Weekly & monthly competitions', completed: false },
        { icon: <Gamepad2 className="w-5 h-5" />, title: 'New Mini-Games', description: '3 additional games: Puzzle Master, Speed Runner, Color Match', completed: false },
        { icon: <Wallet className="w-5 h-5" />, title: 'Wallet Integration', description: 'Connect external crypto wallets', completed: false },
      ]
    },
    {
      quarter: 'Q3 2026',
      status: 'upcoming',
      items: [
        { icon: <Coins className="w-5 h-5" />, title: 'Token Launch', description: 'DART token on blockchain', completed: false },
        { icon: <Sparkles className="w-5 h-5" />, title: 'NFT Marketplace', description: 'Trade in-game items as NFTs', completed: false },
        { icon: <Globe className="w-5 h-5" />, title: 'Multi-language Support', description: 'Support for 10+ languages', completed: false },
      ]
    },
    {
      quarter: 'Q4 2026',
      status: 'upcoming',
      items: [
        { icon: <Users className="w-5 h-5" />, title: 'Strategic Partnerships', description: 'Collaborate with major gaming platforms', completed: false },
        { icon: <Rocket className="w-5 h-5" />, title: 'Tournament System', description: 'Organized esports-style tournaments', completed: false },
        { icon: <Wallet className="w-5 h-5" />, title: 'Staking Rewards', description: 'Stake DART tokens for passive income', completed: false },
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-500/50 bg-green-500/10';
      case 'in-progress':
        return 'border-purple-500/50 bg-purple-500/10';
      default:
        return 'border-gray-700 bg-gray-800/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-6 h-6 text-purple-500 animate-pulse" />;
      default:
        return <Circle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Upcoming';
    }
  };

  return (
    <section id="roadmap" className="py-20 px-4 bg-gray-900/50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Roadmap
          </h2>
          <p className="text-xl text-gray-400">
            Building the future of play-to-earn gaming
          </p>
        </div>

        <div className="space-y-8">
          {roadmapItems.map((quarter, qIndex) => (
            <Card key={qIndex} className={`${getStatusColor(quarter.status)} border transition-all hover:shadow-lg hover:shadow-purple-500/10`}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  {getStatusIcon(quarter.status)}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white">{quarter.quarter}</h3>
                    <p className="text-sm text-gray-400">{getStatusLabel(quarter.status)}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {quarter.items.map((item, iIndex) => (
                    <div key={iIndex} className="flex gap-3 p-4 rounded-lg bg-gray-900/50 border border-gray-700/50">
                      <div className={`${item.completed ? 'text-green-500' : 'text-gray-500'}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                          {item.title}
                          {item.completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        </h4>
                        <p className="text-sm text-gray-400">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 inline-block">
            <CardContent className="p-6">
              <p className="text-gray-300">
                <Sparkles className="w-5 h-5 inline mr-2 text-yellow-500" />
                More exciting features coming soon! Stay tuned for updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
