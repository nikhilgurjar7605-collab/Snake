import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';

interface TelegramChatProps {
  playerName: string;
  score: number;
  kills: number;
  onCommand: (command: string) => void;
}

const BOT_RESPONSES: Record<string, (args: string[], playerName: string, score: number, kills: number) => string> = {
  '/start': () => `🐍 Welcome to Snake.io Telegram!\n\n🎮 Use /help to see all commands\n🏆 Climb the leaderboard\n⚡ Boost to eat more snakes\n\nGood luck, have fun!`,
  '/help': () => `📋 Available Commands:\n\n/start - Start the game\n/help - Show this help\n/stats - Your game stats\n/leaderboard - Top players\n/skin [color] - Change snake color\n/boost - Toggle boost info\n/invite - Invite friends\n/rank - Check your rank\n/rules - Game rules\n/profile - Your profile`,
  '/stats': (_args, name, score, kills) => `📊 Stats for ${name}:\n\n🏅 Score: ${score}\n💀 Kills: ${kills}\n📏 Length: ${10 + score * 2}\n⏱️ Time: ${Math.floor(score / 5)}m\n\nKeep playing to improve!`,
  '/leaderboard': () => `🏆 Global Leaderboard:\n\n🥇 CryptoKing - 2450 pts\n🥈 SnakeMaster - 1890 pts\n🥉 NeonViper - 1650 pts\n4. PixelHunter - 1420 pts\n5. ByteSlither - 1280 pts\n6. GlitchSnake - 1100 pts\n7. VoidCobra - 980 pts\n8. StarSerpent - 870 pts\n9. ThunderTail - 760 pts\n10. ShadowScale - 650 pts`,
  '/rank': (_args, name, score) => {
    const rank = Math.max(1, 50 - Math.floor(score / 10));
    return `📍 Your Rank: #${rank}\n\n🎮 Player: ${name}\n🏅 Score: ${score}\n📈 Progress to top 10: ${Math.min(100, Math.floor(score / 20))}%`;
  },
  '/rules': () => `📜 Game Rules:\n\n1. 🍎 Eat food to grow\n2. 💀 Don't hit other snakes\n3. ⚡ Hold click to boost (costs length)\n4. 🎯 Kill snakes for bonus points\n5. 🏆 Most points wins\n6. 🔄 Wrap around edges is safe\n7. 💎 Special food = more points`,
  '/profile': (_args, name, score, kills) => `👤 Profile: ${name}\n\n🏅 Total Score: ${score}\n💀 Total Kills: ${kills}\n🎮 Games Played: ${Math.floor(score / 20) + 1}\n⭐ Level: ${Math.floor(score / 50) + 1}\n🔥 Win Streak: ${Math.min(kills, 5)}\n\n🏆 Achievements:\n${score > 10 ? '✅ First Blood' : '❌ First Blood'}\n${score > 50 ? '✅ Snake Charmer' : '❌ Snake Charmer'}\n${kills > 5 ? '✅ Predator' : '❌ Predator'}\n${score > 100 ? '✅ Legend' : '❌ Legend'}`,
  '/invite': () => `📨 Invite Friends!\n\nShare this link to play together:\n🔗 t.me/SnakeIOGameBot?start=ref123\n\n🎁 Bonus: +10 score for each friend!\n👥 Friends invited: 0/10\n\nShare in groups for more bonuses!`,
  '/skin': (args) => {
    const colors = ['red', 'blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'yellow'];
    if (args[0] && colors.includes(args[0].toLowerCase())) {
      return `✅ Skin changed to ${args[0]}!\n\n🎨 Available colors:\n${colors.map(c => `• ${c}`).join('\n')}`;
    }
    return `🎨 Change your snake color!\n\nUsage: /skin [color]\n\nAvailable colors:\n${colors.map(c => `• ${c}`).join('\n')}`;
  },
  '/boost': () => `⚡ Boost Mechanic:\n\n• Hold mouse/tap to boost\n• Speed increases by 80%\n• Costs 1 segment per few seconds\n• Great for catching prey\n• Great for escaping danger\n• Leave a trail of food when dying while boosting`,
};

export function TelegramChat({ playerName, score, kills, onCommand }: TelegramChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'SnakeBot',
      text: '🐍 Welcome to Snake.io!\n\nType /help to see commands.\nClick the game area to start playing!\n\nGood luck! 🎮',
      timestamp: new Date(),
      isBot: true,
      isCommand: false,
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const text = input.trim();
    const isCommand = text.startsWith('/');

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: playerName,
      text,
      timestamp: new Date(),
      isBot: false,
      isCommand,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    if (isCommand) {
      const [cmd, ...args] = text.split(' ');
      const handler = BOT_RESPONSES[cmd.toLowerCase()];
      
      if (handler) {
        setTimeout(() => {
          const response: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'SnakeBot',
            text: handler(args, playerName, score, kills),
            timestamp: new Date(),
            isBot: true,
            isCommand: false,
          };
          setMessages(prev => [...prev, response]);
        }, 500);
      } else {
        setTimeout(() => {
          const response: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: 'SnakeBot',
            text: `❓ Unknown command: ${cmd}\n\nType /help to see available commands.`,
            timestamp: new Date(),
            isBot: true,
            isCommand: false,
          };
          setMessages(prev => [...prev, response]);
        }, 500);
      }

      onCommand(cmd.toLowerCase());
    }
  };

  const quickCommands = ['/help', '/stats', '/leaderboard', '/rank', '/profile'];

  return (
    <div className="flex flex-col h-full bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#1c2733] border-b border-gray-700">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-lg">
          🐍
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm">Snake.io Bot</h3>
          <p className="text-green-400 text-xs">online • typing...</p>
        </div>
        <div className="flex gap-1">
          <button className="w-8 h-8 rounded-full hover:bg-gray-700 flex items-center justify-center text-gray-400">
            <span className="text-xs">📞</span>
          </button>
          <button className="w-8 h-8 rounded-full hover:bg-gray-700 flex items-center justify-center text-gray-400">
            <span className="text-xs">⋮</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-line ${
                msg.isBot
                  ? 'bg-gray-800 text-gray-200 rounded-tl-none'
                  : 'bg-blue-600 text-white rounded-tr-none'
              }`}
            >
              {!msg.isBot && (
                <p className="text-blue-200 text-xs font-bold mb-0.5">{msg.sender}</p>
              )}
              <p className="leading-relaxed">{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.isBot ? 'text-gray-500' : 'text-blue-200'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {msg.isBot && ' ✓✓'}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick commands */}
      <div className="px-3 py-2 flex gap-1 overflow-x-auto border-t border-gray-800">
        {quickCommands.map(cmd => (
          <button
            key={cmd}
            onClick={() => {
              setInput(cmd);
              setTimeout(() => handleSend(), 0);
            }}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-blue-400 whitespace-nowrap transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-2 bg-[#1c2733] border-t border-gray-700">
        <div className="flex items-center gap-2">
          <button className="text-gray-400 hover:text-white text-lg">📎</button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a command (/help)..."
            className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={handleSend}
            className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white transition-colors"
          >
            <span className="text-sm">➤</span>
          </button>
        </div>
      </div>
    </div>
  );
}
