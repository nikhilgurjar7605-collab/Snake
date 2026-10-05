import { useState, useCallback } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { GameCanvas } from './components/GameCanvas';
import { Leaderboard } from './components/Leaderboard';
import { TelegramChat } from './components/TelegramChat';
import { GameHUD } from './components/GameHUD';
import { StartScreen } from './components/StartScreen';
import { GameOverScreen } from './components/GameOverScreen';

function App() {
  const [playerName, setPlayerName] = useState('');
  const [showChat, setShowChat] = useState(true);
  const { gameState, startGame, restartGame, setMousePosition, setBoosting } = useGameEngine();

  const handleStart = useCallback((name: string) => {
    setPlayerName(name);
    startGame(name);
  }, [startGame]);

  const handleRestart = useCallback(() => {
    restartGame(playerName);
  }, [restartGame, playerName]);

  const handleMenu = useCallback(() => {
    setPlayerName('');
  }, []);

  const handleCommand = useCallback((_command: string) => {
    // Commands can trigger game actions
  }, []);

  // Start screen
  if (!gameState.gameStarted) {
    return <StartScreen onStart={handleStart} />;
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-gray-900">
      {/* Game Area */}
      <div className="flex-1 relative">
        <GameCanvas
          gameState={gameState}
          onMouseMove={setMousePosition}
          onBoost={setBoosting}
        />
        
        {/* HUD Overlay */}
        <GameHUD gameState={gameState} />

        {/* Leaderboard - top right */}
        <div className="absolute top-4 right-4">
          <Leaderboard gameState={gameState} />
        </div>

        {/* Chat toggle button */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="absolute top-4 left-4 z-40 w-10 h-10 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors"
        >
          {showChat ? '✕' : '💬'}
        </button>

        {/* Game Over */}
        {gameState.isGameOver && (
          <GameOverScreen
            score={gameState.score}
            kills={gameState.kills}
            length={gameState.playerSnake?.segments.length || 0}
            onRestart={handleRestart}
            onMenu={handleMenu}
          />
        )}
      </div>

      {/* Telegram Chat Sidebar */}
      {showChat && (
        <div className="w-80 h-full flex-shrink-0 border-l border-gray-700">
          <TelegramChat
            playerName={playerName}
            score={gameState.score}
            kills={gameState.kills}
            onCommand={handleCommand}
          />
        </div>
      )}
    </div>
  );
}

export default App;
