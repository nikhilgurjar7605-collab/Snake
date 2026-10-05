interface GameOverScreenProps {
  score: number;
  kills: number;
  length: number;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOverScreen({ score, kills, length, onRestart, onMenu }: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/95 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Death animation */}
        <div className="text-6xl mb-4 animate-bounce">💀</div>
        
        <h2 className="text-3xl font-black text-red-400 mb-2">Game Over!</h2>
        <p className="text-gray-400 mb-6">Your snake has been eliminated</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase mb-1">Score</p>
            <p className="text-2xl font-bold text-white">{score}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase mb-1">Kills</p>
            <p className="text-2xl font-bold text-red-400">{kills}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-500 text-xs uppercase mb-1">Length</p>
            <p className="text-2xl font-bold text-green-400">{length}</p>
          </div>
        </div>

        {/* Telegram share */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
          <p className="text-gray-400 text-sm mb-2">Share your score on Telegram!</p>
          <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm text-gray-300">
            🐍 I scored {score} points in Snake.io!
            <br />💀 {kills} kills | 📏 Length: {length}
            <br />
            <span className="text-blue-400">t.me/SnakeIOGameBot</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onMenu}
            className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl transition-all border border-gray-600"
          >
            📋 Menu
          </button>
          <button
            onClick={onRestart}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg"
          >
            🔄 Play Again
          </button>
        </div>

        {/* Tip */}
        <p className="text-gray-600 text-xs mt-4">
          💡 Tip: Use boost strategically to catch prey or escape danger!
        </p>
      </div>
    </div>
  );
}
