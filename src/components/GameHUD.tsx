import { GameState } from '../types';

interface GameHUDProps {
  gameState: GameState;
}

export function GameHUD({ gameState }: GameHUDProps) {
  const player = gameState.playerSnake;
  if (!player) return null;

  return (
    <>
      {/* Top bar - Score and info */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <div className="bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 px-6 py-3 flex items-center gap-6">
          <div className="text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Score</p>
            <p className="text-white font-bold text-xl">{gameState.score}</p>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Length</p>
            <p className="text-green-400 font-bold text-xl">{player.segments.length}</p>
          </div>
          <div className="w-px h-8 bg-gray-700" />
          <div className="text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">Kills</p>
            <p className="text-red-400 font-bold text-xl">{gameState.kills}</p>
          </div>
        </div>
      </div>

      {/* Boost indicator */}
      {player.boosting && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2">
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg px-4 py-1.5 flex items-center gap-2 animate-pulse">
            <span className="text-yellow-400">⚡</span>
            <span className="text-yellow-400 text-sm font-bold">BOOSTING</span>
          </div>
        </div>
      )}

      {/* Bottom controls hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700 px-4 py-2 flex items-center gap-4 text-xs text-gray-400">
          <span>🖱️ Move mouse to steer</span>
          <span className="w-px h-4 bg-gray-700" />
          <span>⚡ Hold click to boost</span>
          <span className="w-px h-4 bg-gray-700" />
          <span>🍎 Eat food to grow</span>
        </div>
      </div>
    </>
  );
}
