export interface Point {
  x: number;
  y: number;
}

export interface Snake {
  id: string;
  name: string;
  segments: Point[];
  direction: number; // angle in radians
  speed: number;
  score: number;
  color: string;
  isAlive: boolean;
  isPlayer: boolean;
  boosting: boolean;
  targetAngle?: number;
  avatar?: string;
}

export interface Food {
  id: string;
  position: Point;
  color: string;
  size: number;
  value: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  kills: number;
  avatar: string;
  isPlayer: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: Date;
  isBot: boolean;
  isCommand: boolean;
}

export interface GameState {
  snakes: Snake[];
  food: Food[];
  worldSize: number;
  playerSnake: Snake | null;
  score: number;
  kills: number;
  isGameOver: boolean;
  gameStarted: boolean;
}

export const SNAKE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0B27A', '#82E0AA',
  '#F1948A', '#AED6F1', '#A3E4D7', '#FAD7A0',
];

export const BOT_NAMES = [
  'CryptoKing', 'SnakeMaster', 'NeonViper', 'PixelHunter',
  'ByteSlither', 'GlitchSnake', 'VoidCobra', 'StarSerpent',
  'ThunderTail', 'ShadowScale', 'IronFang', 'CosmicWorm',
  'BlazeRunner', 'FrostBite', 'StormRider', 'DarkMatter',
  'QuantumSlip', 'NovaStrike', 'CyberPunk', 'MegaByte',
];
