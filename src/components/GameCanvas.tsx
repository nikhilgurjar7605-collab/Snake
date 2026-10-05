import { useRef, useEffect, useCallback } from 'react';
import { GameState, Point } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  onMouseMove: (pos: Point) => void;
  onBoost: (boosting: boolean) => void;
}

export function GameCanvas({ gameState, onMouseMove, onBoost }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getWorldPos = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState.playerSnake) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const head = gameState.playerSnake.segments[0];
    
    return {
      x: head.x + (clientX - rect.left - centerX),
      y: head.y + (clientY - rect.top - centerY),
    };
  }, [gameState.playerSnake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear with dark background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);

    const player = gameState.playerSnake;
    if (!player) return;

    const camX = player.segments[0].x;
    const camY = player.segments[0].y;

    // Draw grid
    ctx.strokeStyle = '#151530';
    ctx.lineWidth = 1;
    const gridSize = 60;
    const startGX = Math.floor((camX - centerX) / gridSize) * gridSize;
    const startGY = Math.floor((camY - centerY) / gridSize) * gridSize;
    
    for (let x = startGX; x < camX + centerX + gridSize; x += gridSize) {
      const screenX = x - camX + centerX;
      ctx.beginPath();
      ctx.moveTo(screenX, 0);
      ctx.lineTo(screenX, height);
      ctx.stroke();
    }
    for (let y = startGY; y < camY + centerY + gridSize; y += gridSize) {
      const screenY = y - camY + centerY;
      ctx.beginPath();
      ctx.moveTo(0, screenY);
      ctx.lineTo(width, screenY);
      ctx.stroke();
    }

    // Draw world border with glow
    const borderX = -camX + centerX;
    const borderY = -camY + centerY;
    
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 3;
    ctx.setLineDash([15, 10]);
    ctx.strokeRect(borderX, borderY, gameState.worldSize, gameState.worldSize);
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Draw danger zone near borders
    const dangerZone = 100;
    const headX = player.segments[0].x;
    const headY = player.segments[0].y;
    if (headX < dangerZone || headX > gameState.worldSize - dangerZone ||
        headY < dangerZone || headY > gameState.worldSize - dangerZone) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw food with glow
    for (const food of gameState.food) {
      const screenX = food.position.x - camX + centerX;
      const screenY = food.position.y - camY + centerY;
      
      if (screenX < -50 || screenX > width + 50 || screenY < -50 || screenY > height + 50) continue;
      
      // Outer glow
      ctx.beginPath();
      ctx.arc(screenX, screenY, food.size + 3, 0, Math.PI * 2);
      ctx.fillStyle = food.color + '33';
      ctx.fill();
      
      // Main food
      ctx.beginPath();
      ctx.arc(screenX, screenY, food.size, 0, Math.PI * 2);
      ctx.fillStyle = food.color;
      ctx.fill();
      
      // Inner highlight
      ctx.beginPath();
      ctx.arc(screenX - food.size * 0.2, screenY - food.size * 0.2, food.size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
    }

    // Draw snakes (player last so it's on top)
    const sortedSnakes = [...gameState.snakes].sort((a, b) => {
      if (a.isPlayer) return 1;
      if (b.isPlayer) return -1;
      return 0;
    });

    for (const snake of sortedSnakes) {
      if (!snake.isAlive) continue;
      
      const segments = snake.segments;
      if (segments.length === 0) continue;

      // Visibility check
      const headScreen = {
        x: segments[0].x - camX + centerX,
        y: segments[0].y - camY + centerY,
      };
      if (headScreen.x < -300 || headScreen.x > width + 300 || 
          headScreen.y < -300 || headScreen.y > height + 300) continue;

      const isPlayerSnake = snake.isPlayer;
      const bodyWidth = isPlayerSnake ? 18 : 14;
      const innerWidth = isPlayerSnake ? 12 : 9;

      // Draw body segments with gradient effect
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Shadow/glow for player
      if (isPlayerSnake) {
        ctx.shadowColor = snake.color;
        ctx.shadowBlur = 8;
      }

      // Outer body
      ctx.beginPath();
      ctx.moveTo(
        segments[0].x - camX + centerX,
        segments[0].y - camY + centerY
      );
      for (let i = 1; i < segments.length; i++) {
        ctx.lineTo(
          segments[i].x - camX + centerX,
          segments[i].y - camY + centerY
        );
      }
      ctx.strokeStyle = snake.color;
      ctx.lineWidth = bodyWidth;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner lighter body
      ctx.beginPath();
      ctx.moveTo(
        segments[0].x - camX + centerX,
        segments[0].y - camY + centerY
      );
      for (let i = 1; i < segments.length; i++) {
        ctx.lineTo(
          segments[i].x - camX + centerX,
          segments[i].y - camY + centerY
        );
      }
      ctx.strokeStyle = snake.color + '55';
      ctx.lineWidth = innerWidth;
      ctx.stroke();

      // Draw pattern on body (dots)
      if (segments.length > 5) {
        for (let i = 5; i < segments.length; i += 8) {
          const sx = segments[i].x - camX + centerX;
          const sy = segments[i].y - camY + centerY;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fill();
        }
      }

      // Draw head
      const head = segments[0];
      const hx = head.x - camX + centerX;
      const hy = head.y - camY + centerY;
      const headRadius = isPlayerSnake ? 12 : 9;
      
      // Head glow
      if (isPlayerSnake) {
        ctx.beginPath();
        ctx.arc(hx, hy, headRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = snake.color + '33';
        ctx.fill();
      }
      
      ctx.beginPath();
      ctx.arc(hx, hy, headRadius, 0, Math.PI * 2);
      ctx.fillStyle = snake.color;
      ctx.fill();

      // Eyes
      const eyeOffset = headRadius * 0.5;
      const eyeAngle1 = snake.direction + 0.5;
      const eyeAngle2 = snake.direction - 0.5;
      
      // Eye whites
      ctx.beginPath();
      ctx.arc(
        hx + Math.cos(eyeAngle1) * eyeOffset,
        hy + Math.sin(eyeAngle1) * eyeOffset,
        4, 0, Math.PI * 2
      );
      ctx.fillStyle = '#fff';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(
        hx + Math.cos(eyeAngle2) * eyeOffset,
        hy + Math.sin(eyeAngle2) * eyeOffset,
        4, 0, Math.PI * 2
      );
      ctx.fillStyle = '#fff';
      ctx.fill();

      // Pupils
      const pupilOffset = 1.5;
      ctx.beginPath();
      ctx.arc(
        hx + Math.cos(eyeAngle1) * eyeOffset + Math.cos(snake.direction) * pupilOffset,
        hy + Math.sin(eyeAngle1) * eyeOffset + Math.sin(snake.direction) * pupilOffset,
        2, 0, Math.PI * 2
      );
      ctx.fillStyle = '#111';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(
        hx + Math.cos(eyeAngle2) * eyeOffset + Math.cos(snake.direction) * pupilOffset,
        hy + Math.sin(eyeAngle2) * eyeOffset + Math.sin(snake.direction) * pupilOffset,
        2, 0, Math.PI * 2
      );
      ctx.fillStyle = '#111';
      ctx.fill();

      // Name tag
      ctx.font = `bold ${isPlayerSnake ? 13 : 11}px 'Segoe UI', Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.strokeText(snake.name, hx, hy - headRadius - 10);
      ctx.fillStyle = isPlayerSnake ? '#4ade80' : '#ffffff';
      ctx.fillText(snake.name, hx, hy - headRadius - 10);

      // Score below name
      ctx.font = '10px Arial';
      ctx.fillStyle = '#888';
      ctx.fillText(`${snake.score}`, hx, hy - headRadius - 0);

      // Boost particles
      if (snake.boosting && snake.isAlive && segments.length > 2) {
        for (let i = 0; i < 3; i++) {
          const tailIdx = Math.min(segments.length - 1, 5 + i * 3);
          const tail = segments[tailIdx];
          const tx = tail.x - camX + centerX + (Math.random() - 0.5) * 10;
          const ty = tail.y - camY + centerY + (Math.random() - 0.5) * 10;
          ctx.beginPath();
          ctx.arc(tx, ty, 2 + Math.random() * 3, 0, Math.PI * 2);
          ctx.fillStyle = snake.color + '88';
          ctx.fill();
        }
      }
    }

    // Draw minimap
    const mapSize = 140;
    const mapX = width - mapSize - 15;
    const mapY = height - mapSize - 15;
    const mapScale = mapSize / gameState.worldSize;

    // Minimap background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(mapX - 5, mapY - 5, mapSize + 10, mapSize + 10, 8);
    ctx.fill();
    ctx.stroke();

    // Grid on minimap
    ctx.strokeStyle = '#1a1a3a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const pos = mapX + (mapSize / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pos, mapY);
      ctx.lineTo(pos, mapY + mapSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mapX, pos);
      ctx.lineTo(mapX + mapSize, pos);
      ctx.stroke();
    }

    // Draw snakes on minimap
    for (const snake of gameState.snakes) {
      if (!snake.isAlive) continue;
      const dotX = mapX + snake.segments[0].x * mapScale;
      const dotY = mapY + snake.segments[0].y * mapScale;
      ctx.beginPath();
      ctx.arc(dotX, dotY, snake.isPlayer ? 4 : 2, 0, Math.PI * 2);
      ctx.fillStyle = snake.isPlayer ? '#4ade80' : snake.color;
      ctx.fill();
      
      if (snake.isPlayer) {
        ctx.beginPath();
        ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.strokeStyle = '#4ade8066';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Minimap label
    ctx.font = '9px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('MAP', mapX + mapSize / 2, mapY - 8);

  }, [gameState]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = getWorldPos(e.clientX, e.clientY);
    onMouseMove(pos);
  }, [getWorldPos, onMouseMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const pos = getWorldPos(touch.clientX, touch.clientY);
      onMouseMove(pos);
    }
  }, [getWorldPos, onMouseMove]);

  const handleMouseDown = useCallback(() => {
    onBoost(true);
  }, [onBoost]);

  const handleMouseUp = useCallback(() => {
    onBoost(false);
  }, [onBoost]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const pos = getWorldPos(touch.clientX, touch.clientY);
      onMouseMove(pos);
    }
    if (e.touches.length > 1) {
      onBoost(true);
    }
  }, [getWorldPos, onMouseMove, onBoost]);

  const handleTouchEnd = useCallback(() => {
    onBoost(false);
  }, [onBoost]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: 'none' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}
