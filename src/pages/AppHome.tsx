// src/pages/AppHome.tsx

import { useNavigate } from "react-router-dom";
import { Wallet, Gamepad2, Pickaxe, Trophy } from "lucide-react";

const AppHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col">
      
      {/* HEADER */}
      <header className="p-4 text-center border-b border-white/10">
        <h1 className="text-2xl font-bold">Dart AI</h1>
        <p className="text-sm text-white/70">Mine · Play · Collect</p>
      </header>

      {/* WALLET */}
      <div className="p-4">
        <div className="bg-slate-700 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="text-yellow-400" />
            <div>
              <p className="text-sm text-white/70">Darts Balance</p>
              <p className="text-lg font-semibold">0</p>
            </div>
          </div>
          <button
            className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold"
            onClick={() => alert("Wallet coming soon")}
          >
            Withdraw
          </button>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex-1 p-4 grid grid-cols-2 gap-4">
        
        <button
          onClick={() => navigate("/games")}
          className="bg-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-600"
        >
          <Gamepad2 size={32} />
          <span>Games</span>
        </button>

        <button
          onClick={() => alert("Mining coming soon")}
          className="bg-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-600"
        >
          <Pickaxe size={32} />
          <span>Mining</span>
        </button>

        <button
          onClick={() => navigate("/leaderboard")}
          className="bg-slate-700 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-600 col-span-2"
        >
          <Trophy size={32} />
          <span>Leaderboard</span>
        </button>

      </div>
    </div>
  );
};

export default AppHome;