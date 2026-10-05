import { GameState } from '../types';

interface LeaderboardProps {
  gameState: GameState;
}

export function Leaderboard({ gameState }: LeaderboardProps) {
  const sortedSnakes = [...gameState.snakes]
    .filter(s => s.isAlive)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 p-4 w-64">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🏆</span>
        <h3 className="text-white font-bold text-sm uppercase tracking-wide">Leaderboard</h3>
      </div>
      <div className="space-y-1">
        {sortedSnakes.map((snake, index) => (
          <div
            key={snake.id}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${
              snake.isPlayer
                ? 'bg-green-500/20 border border-green-500/40'
                : 'bg-gray-800/50 hover:bg-gray-700/50'
            }`}
          >
            <span className={`font-bold w-5 text-center ${
              index === 0 ? 'text-yellow-400' :
              index === 1 ? 'text-gray-300' :
              index === 2 ? 'text-orange-400' :
              'text-gray-500'
            }`}>
              {index + 1}
            </span>
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: snake.color }}
            />
            <span className={`flex-1 truncate ${
              snake.isPlayer ? 'text-green-400 font-bold' : 'text-gray-300'
            }`}>
              {snake.name}
            </span>
            <span className="text-gray-400 font-mono text-xs">
              {snake.score}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Players alive: {gameState.snakes.filter(s => s.isAlive).length}</span>
          <span>Your rank: #{sortedSnakes.findIndex(s => s.isPlayer) + 1 || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
