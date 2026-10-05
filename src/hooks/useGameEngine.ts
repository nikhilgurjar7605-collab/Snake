import { useState, useRef, useCallback, useEffect } from 'react';
import { Snake, Food, Point, GameState, SNAKE_COLORS, BOT_NAMES } from '../types';

const WORLD_SIZE = 4000;
const INITIAL_FOOD_COUNT = 300;
const BOT_COUNT = 15;
const SEGMENT_SPACING = 8;
const BASE_SPEED = 3;
const BOOST_SPEED = 5.5;
const TURN_SPEED = 0.12;
const FOOD_SIZE = 6;

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function randomPoint(): Point {
  return {
    x: Math.random() * WORLD_SIZE,
    y: Math.random() * WORLD_SIZE,
  };
}

function createFood(): Food {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7', '#DDA0DD', '#82E0AA', '#F7DC6F', '#FF9FF3', '#54A0FF', '#5F27CD'];
  return {
    id: generateId(),
    position: randomPoint(),
    color: colors[Math.floor(Math.random() * colors.length)],
    size: FOOD_SIZE + Math.random() * 4,
    value: Math.floor(Math.random() * 3) + 1,
  };
}

function createSnake(name: string, color: string, isPlayer: boolean): Snake {
  const startPos = randomPoint();
  const segments: Point[] = [];
  for (let i = 0; i < 10; i++) {
    segments.push({ x: startPos.x - i * SEGMENT_SPACING, y: startPos.y });
  }
  return {
    id: generateId(),
    name,
    segments,
    direction: Math.random() * Math.PI * 2,
    speed: BASE_SPEED,
    score: 0,
    color,
    isAlive: true,
    isPlayer,
    boosting: false,
  };
}

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>({
    snakes: [],
    food: [],
    worldSize: WORLD_SIZE,
    playerSnake: null,
    score: 0,
    kills: 0,
    isGameOver: false,
    gameStarted: false,
  });

  const snakesRef = useRef<Snake[]>([]);
  const foodRef = useRef<Food[]>([]);
  const animFrameRef = useRef<number>(0);
  const mousePosRef = useRef<Point>({ x: 0, y: 0 });
  const isBoostingRef = useRef(false);
  const isRunningRef = useRef(false);
  const killsRef = useRef(0);
  const isGameOverRef = useRef(false);

  const initGame = useCallback((playerName: string) => {
    const playerColor = SNAKE_COLORS[Math.floor(Math.random() * SNAKE_COLORS.length)];
    const player = createSnake(playerName, playerColor, true);
    
    const bots: Snake[] = [];
    for (let i = 0; i < BOT_COUNT; i++) {
      const name = BOT_NAMES[i % BOT_NAMES.length];
      const color = SNAKE_COLORS[Math.floor(Math.random() * SNAKE_COLORS.length)];
      const bot = createSnake(name, color, false);
      bot.score = Math.floor(Math.random() * 50);
      for (let j = 0; j < bot.score; j++) {
        const lastSeg = bot.segments[bot.segments.length - 1];
        bot.segments.push({ ...lastSeg });
      }
      bots.push(bot);
    }

    const food: Food[] = [];
    for (let i = 0; i < INITIAL_FOOD_COUNT; i++) {
      food.push(createFood());
    }

    snakesRef.current = [player, ...bots];
    foodRef.current = food;
    killsRef.current = 0;
    isGameOverRef.current = false;
    isRunningRef.current = true;

    setGameState({
      snakes: [...snakesRef.current],
      food: [...foodRef.current],
      worldSize: WORLD_SIZE,
      playerSnake: { ...player },
      score: 0,
      kills: 0,
      isGameOver: false,
      gameStarted: true,
    });
  }, []);

  const updateBotAI = useCallback((bot: Snake, snakes: Snake[], food: Food[]): void => {
    if (!bot.isAlive) return;

    const head = bot.segments[0];
    let targetPoint: Point | null = null;
    let minDist = Infinity;

    // Find nearest food
    for (const f of food) {
      const dist = distance(head, f.position);
      if (dist < minDist && dist < 500) {
        minDist = dist;
        targetPoint = f.position;
      }
    }

    // Avoid other snake bodies
    for (const other of snakes) {
      if (other.id === bot.id || !other.isAlive) continue;
      for (let i = 0; i < Math.min(other.segments.length, 30); i++) {
        const dist = distance(head, other.segments[i]);
        if (dist < 80) {
          const awayAngle = Math.atan2(head.y - other.segments[i].y, head.x - other.segments[i].x);
          bot.targetAngle = awayAngle;
          bot.boosting = dist < 50;
          return;
        }
      }
    }

    // Avoid walls
    const margin = 300;
    if (head.x < margin || head.x > WORLD_SIZE - margin || head.y < margin || head.y > WORLD_SIZE - margin) {
      bot.targetAngle = Math.atan2(WORLD_SIZE / 2 - head.y, WORLD_SIZE / 2 - head.x);
      return;
    }

    if (targetPoint) {
      bot.targetAngle = Math.atan2(targetPoint.y - head.y, targetPoint.x - head.x);
    } else {
      if (Math.random() < 0.03) {
        bot.targetAngle = bot.direction + (Math.random() - 0.5) * 2;
      }
    }

    // Random boost behavior
    bot.boosting = Math.random() < 0.005 && bot.score > 10;
  }, []);

  const moveSnake = useCallback((snake: Snake): void => {
    if (!snake.isAlive) return;

    // Update direction
    if (snake.isPlayer) {
      const targetAngle = Math.atan2(
        mousePosRef.current.y - snake.segments[0].y,
        mousePosRef.current.x - snake.segments[0].x
      );
      let diff = targetAngle - snake.direction;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      snake.direction += diff * TURN_SPEED;
    } else if (snake.targetAngle !== undefined) {
      let diff = snake.targetAngle - snake.direction;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      snake.direction += diff * TURN_SPEED * 1.5;
    }

    const speed = snake.boosting ? BOOST_SPEED : BASE_SPEED;
    const head = snake.segments[0];
    const newHead: Point = {
      x: head.x + Math.cos(snake.direction) * speed,
      y: head.y + Math.sin(snake.direction) * speed,
    };

    // Wrap around world
    if (newHead.x < 0) newHead.x += WORLD_SIZE;
    if (newHead.x > WORLD_SIZE) newHead.x -= WORLD_SIZE;
    if (newHead.y < 0) newHead.y += WORLD_SIZE;
    if (newHead.y > WORLD_SIZE) newHead.y -= WORLD_SIZE;

    snake.segments.unshift(newHead);
    
    // Maintain length based on score
    const targetLength = 10 + snake.score * 2;
    while (snake.segments.length > targetLength) {
      snake.segments.pop();
    }

    // Boosting costs score
    if (snake.boosting && snake.score > 0) {
      if (Math.random() < 0.03) {
        snake.score = Math.max(0, snake.score - 1);
      }
    }
  }, []);

  const checkCollisions = useCallback((): void => {
    const snakes = snakesRef.current;
    const food = foodRef.current;
    const aliveSnakes = snakes.filter(s => s.isAlive);

    for (const snake of aliveSnakes) {
      const head = snake.segments[0];

      // Check food collision
      for (let i = food.length - 1; i >= 0; i--) {
        const f = food[i];
        if (distance(head, f.position) < f.size + 14) {
          snake.score += f.value;
          food.splice(i, 1);
          food.push(createFood());
        }
      }

      // Check snake collision
      for (const other of aliveSnakes) {
        if (other.id === snake.id) continue;
        
        for (let i = 3; i < other.segments.length; i++) {
          if (distance(head, other.segments[i]) < 12) {
            snake.isAlive = false;
            other.score += Math.floor(snake.score / 2) + 5;
            
            if (snake.isPlayer) {
              isGameOverRef.current = true;
            }
            if (other.isPlayer) {
              killsRef.current++;
            }
            
            // Drop food from dead snake
            for (let j = 0; j < snake.segments.length; j += 3) {
              food.push({
                id: generateId(),
                position: { ...snake.segments[j] },
                color: snake.color,
                size: FOOD_SIZE + 3,
                value: 2,
              });
            }
            break;
          }
        }
      }
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (!isRunningRef.current || isGameOverRef.current) {
      if (isGameOverRef.current) {
        const player = snakesRef.current.find(s => s.isPlayer);
        setGameState(prev => ({
          ...prev,
          snakes: [...snakesRef.current],
          food: [...foodRef.current],
          playerSnake: player ? { ...player, segments: [...player.segments] } : null,
          score: player?.score || 0,
          kills: killsRef.current,
          isGameOver: true,
        }));
      }
      return;
    }

    const snakes = snakesRef.current;
    const food = foodRef.current;

    // Update bots
    for (const snake of snakes) {
      if (!snake.isPlayer && snake.isAlive) {
        updateBotAI(snake, snakes, food);
      }
    }

    // Set player boost
    const player = snakes.find(s => s.isPlayer);
    if (player && player.isAlive) {
      player.boosting = isBoostingRef.current && player.score > 0;
    }

    // Move all snakes
    for (const snake of snakes) {
      moveSnake(snake);
    }

    // Check collisions
    checkCollisions();

    // Respawn dead bots
    for (const snake of snakes) {
      if (!snake.isPlayer && !snake.isAlive) {
        if (Math.random() < 0.008) {
          const newSnake = createSnake(snake.name, snake.color, false);
          newSnake.id = snake.id;
          Object.assign(snake, newSnake);
        }
      }
    }

    // Maintain food count
    while (food.length < INITIAL_FOOD_COUNT) {
      food.push(createFood());
    }

    // Update React state for rendering
    const currentPlayer = snakes.find(s => s.isPlayer);
    setGameState(prev => ({
      ...prev,
      snakes: snakes.map(s => ({ ...s, segments: [...s.segments] })),
      food: [...food],
      playerSnake: currentPlayer ? { ...currentPlayer, segments: [...currentPlayer.segments] } : null,
      score: currentPlayer?.score || 0,
      kills: killsRef.current,
      isGameOver: isGameOverRef.current,
    }));

    animFrameRef.current = requestAnimationFrame(gameLoop);
  }, [updateBotAI, moveSnake, checkCollisions]);

  const startGame = useCallback((playerName: string) => {
    cancelAnimationFrame(animFrameRef.current);
    initGame(playerName);
    setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(gameLoop);
    }, 50);
  }, [initGame, gameLoop]);

  const restartGame = useCallback((playerName: string) => {
    cancelAnimationFrame(animFrameRef.current);
    isRunningRef.current = false;
    setTimeout(() => {
      startGame(playerName);
    }, 100);
  }, [startGame]);

  const setMousePosition = useCallback((pos: Point) => {
    mousePosRef.current = pos;
  }, []);

  const setBoosting = useCallback((boosting: boolean) => {
    isBoostingRef.current = boosting;
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      isRunningRef.current = false;
    };
  }, []);

  return {
    gameState,
    startGame,
    restartGame,
    setMousePosition,
    setBoosting,
  };
}
