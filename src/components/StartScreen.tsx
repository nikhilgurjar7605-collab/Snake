import { useState } from 'react';

interface StartScreenProps {
  onStart: (name: string) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [name, setName] = useState('');
  const [showCommands, setShowCommands] = useState(false);

  const handleStart = () => {
    const playerName = name.trim() || 'Player' + Math.floor(Math.random() * 1000);
    onStart(playerName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-bounce">🐍</div>
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-blue-400 to-purple-500 mb-2">
            Snake.io
          </h1>
          <p className="text-gray-400 text-lg">Telegram Multiplayer Edition</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm">1,247 players online</span>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 mb-4">
          {/* Name input */}
          <div className="mb-6">
            <label className="text-gray-400 text-sm font-medium mb-2 block">
              Enter your nickname
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  placeholder="YourName"
                  maxLength={20}
                  className="w-full bg-gray-900 border border-gray-600 rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                onClick={handleStart}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-green-500/20"
              >
                ▶ Play
              </button>
            </div>
          </div>

          {/* Quick info */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-900/50 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">🎮</div>
              <p className="text-gray-400 text-xs">Multiplayer</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">🏆</div>
              <p className="text-gray-400 text-xs">Leaderboard</p>
            </div>
            <div className="bg-gray-900/50 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-gray-400 text-xs">Boost</p>
            </div>
          </div>

          {/* Telegram features */}
          <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span>
              <h3 className="text-white font-bold text-sm">Telegram Bot Commands</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { cmd: '/start', desc: 'Start game' },
                { cmd: '/help', desc: 'Show commands' },
                { cmd: '/stats', desc: 'Your stats' },
                { cmd: '/leaderboard', desc: 'Top players' },
                { cmd: '/skin', desc: 'Change color' },
                { cmd: '/invite', desc: 'Invite friends' },
              ].map(item => (
                <div key={item.cmd} className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-2 py-1.5">
                  <code className="text-blue-400 font-mono">{item.cmd}</code>
                  <span className="text-gray-500">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Show/hide commands */}
        <button
          onClick={() => setShowCommands(!showCommands)}
          className="w-full text-center text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
        >
          {showCommands ? '▲ Hide instructions' : '▼ Show game instructions'}
        </button>

        {showCommands && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 mt-2">
            <h3 className="text-white font-bold mb-3">🎮 How to Play</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                Move your mouse to control the snake direction
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                Hold left click to boost (uses length)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                Eat glowing food to grow longer
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                Make other snakes hit your body to eliminate them
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                Don't hit other snakes' bodies!
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                The world wraps around - no walls to hit
              </li>
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-xs">
          <p>Snake.io Telegram Bot • v2.0 • Made with ❤️</p>
          <p className="mt-1">Share: t.me/SnakeIOGameBot</p>
        </div>
      </div>
    </div>
  );
}
