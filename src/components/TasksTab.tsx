import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  CheckCircle,
  Share2,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Share } from '@capacitor/share';
import { useWallet } from '../hooks/useWallet';
import { BannerAd } from './BannerAd';
import { RewardedAdModal } from './RewardedAdModal';

interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: string;
  url: string;
  completed: boolean;
}

const TasksTab: React.FC = () => {
  const { addTransaction } = useWallet();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAdModal, setShowAdModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Load tasks + completed state from localStorage
  useEffect(() => {
    const completedTasks: string[] = JSON.parse(
      localStorage.getItem('completedTasks') || '[]'
    );

    const initialTasks: Task[] = [
      {
        id: 'telegram',
        title: 'Join Telegram',
        description: 'Join our community chat',
        reward: 50,
        icon: '💬',
        url: 'https://t.me/+PZIPvIsWyPw2YjRl',
        completed: completedTasks.includes('telegram'),
      },
      {
        id: 'share',
        title: 'Share App',
        description: 'Share with friends',
        reward: 50,
        icon: '📱',
        url: '',
        completed: completedTasks.includes('share'),
      },
    ];

    setTasks(initialTasks);
  }, []);

  const handleTaskClick = async (task: Task) => {
    if (task.completed) return;

    if (task.id === 'share') {
      const referralCode = localStorage.getItem('referralCode') || '';
      const referralLink = 'https://dartai.app/ref/' + referralCode;

      try {
        // Use Capacitor Share API for native sharing
        await Share.share({
          title: 'Dart AI - Earn Rewards!',
          text: 'Join me in collecting Dart points and playing games! Use my referral code: ' + referralCode,
          url: referralLink,
          dialogTitle: 'Share Dart AI with friends',
        });
        
        // After sharing, ask for confirmation
        setTimeout(() => {
          const confirmed = confirm('Did you share the app? Click OK to claim your reward.');
          if (confirmed) {
            setSelectedTask(task);
          }
        }, 500);
      } catch (error) {
        // Fallback to clipboard if share is cancelled or not available
        console.log('Share cancelled or not available:', error);
      }
    } else if (task.id === 'telegram') {
      // Open Telegram link
      if (task.url) {
        window.open(task.url, '_blank');
      }
      
      // After opening link, ask for confirmation
      setTimeout(() => {
        const confirmed = confirm('Did you join our Telegram group? Click OK to claim your reward.');
        if (confirmed) {
          setSelectedTask(task);
        }
      }, 1000);
    } else {
      if (task.url) {
        window.open(task.url, '_blank');
      }
      setSelectedTask(task);
    }
  };

  const completeTask = async (reward: number) => {
    if (!selectedTask) return;

    const completedTasks: string[] = JSON.parse(
      localStorage.getItem('completedTasks') || '[]'
    );

    if (!completedTasks.includes(selectedTask.id)) {
      completedTasks.push(selectedTask.id);
      localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === selectedTask.id ? { ...t, completed: true } : t
      )
    );

    // No template literal -> avoids $ parse issues
    await addTransaction('Task', reward, selectedTask.title + ' completed');

    setSelectedTask(null);
    setShowAdModal(false);
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasksList = tasks.filter((t) => t.completed);

  const totalCollected = completedTasksList.reduce(
    (sum, t) => sum + t.reward,
    0
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white pb-20">
      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Tasks</h1>
          <p className="text-gray-400">
            Complete social tasks to collect DART points
          </p>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Tasks Completed</p>
              <p className="text-2xl font-bold text-white">
                {completedTasksList.length}/{tasks.length}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Total Collected</p>
              <p className="text-2xl font-bold text-white">
                {totalCollected} DART
              </p>
            </div>
          </div>
        </div>

        {/* PENDING TASKS */}
        {pendingTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Available Tasks</h2>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className={`
                    ${task.id === 'telegram' 
                      ? 'bg-gradient-to-br from-[#0088cc]/20 via-gray-900 to-gray-900 border-[#0088cc]/50 hover:border-[#0088cc] shadow-lg hover:shadow-[#0088cc]/20' 
                      : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }
                    rounded-2xl p-4 border-2 transition-all duration-300 hover:scale-[1.02] transform group cursor-pointer
                  `}
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      ${task.id === 'telegram' 
                        ? 'bg-[#0088cc] animate-pulse' 
                        : 'bg-gray-800'
                      } 
                      w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110
                    `}>
                      <span className="text-3xl">{task.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className={`
                        font-bold text-lg
                        ${task.id === 'telegram' 
                          ? 'bg-gradient-to-r from-[#0088cc] to-blue-400 bg-clip-text text-transparent' 
                          : 'text-white'
                        }
                      `}>
                        {task.title}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <p className={`
                          text-sm font-bold
                          ${task.id === 'telegram' 
                            ? 'text-[#0088cc]' 
                            : 'text-green-400'
                          }
                        `}>
                          +{task.reward} DART
                        </p>
                        {task.id === 'telegram' && (
                          <span className="px-2 py-0.5 bg-[#0088cc]/20 border border-[#0088cc]/50 rounded-full text-xs text-[#0088cc] font-semibold animate-pulse">
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className={`
                        ${task.id === 'telegram'
                          ? 'bg-gradient-to-r from-[#0088cc] to-[#0077b5] hover:from-[#0077b5] hover:to-[#006699] shadow-lg shadow-[#0088cc]/30' 
                          : 'bg-blue-600 hover:bg-blue-700'
                        }
                        text-white px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 group-hover:scale-105 relative overflow-hidden
                      `}
                    >
                      {task.id === 'telegram' && (
                        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        {task.id === 'share' ? (
                          <>
                            <Share2 size={16} />
                            <span>Share</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink size={16} className="group-hover:rotate-45 transition-transform duration-300" />
                            <span>Join</span>
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CLAIM BANNER FOR SELECTED TASK */}
        {selectedTask && !selectedTask.completed && (
          <div className="bg-green-900/20 border border-green-700 rounded-2xl p-4">
            <h3 className="font-semibold mb-2 text-green-400">
              Ready to Claim?
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Claim {selectedTask.reward} DART for "
              {selectedTask.title}"
            </p>
            <div className="space-y-2">
              <button
                onClick={() => completeTask(selectedTask.reward)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl"
              >
                Claim {selectedTask.reward} DART
              </button>
              <button
                onClick={() => setShowAdModal(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                <span>Watch Ad for Double Reward (2x)</span>
              </button>
            </div>
          </div>
        )}

        {/* COMPLETED TASKS */}
        {completedTasksList.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Completed Tasks</h2>
            <div className="space-y-3">
              {completedTasksList.map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-900 rounded-2xl p-4 border border-gray-800 opacity-75"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl grayscale">{task.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-400">
                        {task.title}
                      </h3>
                      <p className="text-green-500 text-sm font-medium">
                        +{task.reward} DART
                      </p>
                    </div>
                    <CheckCircle className="text-green-500" size={24} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DISCLAIMER */}
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="text-yellow-500 flex-shrink-0 mt-0.5"
            />
            <p className="text-xs text-yellow-200/80">
              All points, gems, and items in Dart AI are virtual and used only
              inside the game. They do not represent real money, crypto,
              tokens, or financial rewards.
            </p>
          </div>
        </div>

        <BannerAd className="mt-4" />
      </div>

      {/* REWARDED AD MODAL */}
      <RewardedAdModal
        open={showAdModal}
        onClose={() => setShowAdModal(false)}
        onRewardGranted={() => {
          if (selectedTask) {
            completeTask(selectedTask.reward * 2);
          }
        }}
        title="Double Your Reward"
        description={
          'Watch an ad to double your reward to ' +
          ((selectedTask?.reward || 0) * 2) +
          ' DART'
        }
      />
    </div>
  );
};

export default TasksTab;
