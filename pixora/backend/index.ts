import { router, json, error, db, requireAuth, increment } from '@appdeploy/sdk';
import { notifySubscribers, realtimeSubscriptionRoutes } from './realtime-subscribers';

type Player = { userId: string; name: string; mark: 'X' | 'O' };
type Room = {
  id: string; code: string; hostId: string; players: Player[]; board: string[];
  currentTurn: 'X' | 'O'; status: 'waiting' | 'playing' | 'completed';
  winner: string; version: number; createdAt: number; updatedAt: number;
};

const ROOMS = 'pixora_rooms';
const PROFILES = 'pixora_profiles';
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

function cleanName(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim()
    ? value.trim().replace(/[<>]/g, '').slice(0, 20)
    : fallback.slice(0, 20);
}
function makeCode() { return Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'P'); }
function roomView(room: Room) {
  return { code: room.code, players: room.players, board: room.board, currentTurn: room.currentTurn,
    status: room.status, winner: room.winner, version: room.version, createdAt: room.createdAt };
}
function profileView(profile: any, userId: string, fallbackName = 'Player') {
  return {
    userId,
    name: profile?.name || fallbackName,
    stats: { played: profile?.played || 0, wins: profile?.wins || 0, losses: profile?.losses || 0 },
  };
}
async function getRoom(code: string): Promise<Room | null> {
  const [room] = await db.get<Room>(ROOMS, ['room-' + code.toUpperCase()], { consistent: true });
  return room;
}
async function ensureProfile(userId: string, name: string) {
  const id = 'player-' + userId;
  const [existing] = await db.get(PROFILES, [id], { consistent: true });
  if (!existing) {
    await db.tx.add(PROFILES, [{ id, userId, name, played: 0, wins: 0, losses: 0, updatedAt: Date.now() }]);
  }
  return id;
}
async function recordResult(room: Room) {
  const winner = room.players.find(player => player.mark === room.winner);
  for (const player of room.players) {
    const id = await ensureProfile(player.userId, player.name);
    const [ok] = await db.tx.update(PROFILES, [{
      id,
      record: {
        played: increment(1),
        wins: increment(winner?.userId === player.userId ? 1 : 0),
        losses: increment(winner && winner.userId !== player.userId ? 1 : 0),
        updatedAt: Date.now(),
      },
    }], { patch: true });
    if (!ok) console.warn('PIXORA profile stats update did not apply for', player.userId);
  }
}
async function publishRoom(room: Room) {
  await notifySubscribers('room', room.code, roomView(room));
}

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
  ...realtimeSubscriptionRoutes,

  'GET /api/profile': [
    requireAuth(),
    async ({ user }) => {
      const id = 'player-' + user!.userId;
      const [profile] = await db.get(PROFILES, [id], { consistent: true });
      return json({ profile: profileView(profile, user!.userId, user!.name || 'Player') });
    },
  ],

  'PUT /api/profile': [
    requireAuth(),
    async ({ user, body }) => {
      const input = (body || {}) as { name?: string };
      const name = cleanName(input.name, user!.name || 'Player');
      const id = await ensureProfile(user!.userId, name);
      const [ok] = await db.tx.update(PROFILES, [{ id, record: { name, updatedAt: Date.now() } }], { patch: true });
      if (!ok) return error('Profile could not be saved. Please retry.', 409);
      const [profile] = await db.get(PROFILES, [id], { consistent: true });
      return json({ profile: profileView(profile, user!.userId, name) });
    },
  ],

  'GET /api/leaderboard': [
    requireAuth(),
    async () => {
      const { items } = await db.list(PROFILES, { limit: 100 });
      const players = items.map(item => profileView(item, item.userId, 'Player'))
        .sort((a, b) => b.stats.wins - a.stats.wins || b.stats.played - a.stats.played)
        .slice(0, 50);
      return json({ players });
    },
  ],

  'POST /api/rooms': [
    requireAuth(),
    async ({ user, body }) => {
      const input = (body || {}) as { name?: string };
      const name = cleanName(input.name, user!.name || 'Player');
      let room: Room | null = null;
      for (let attempt = 0; attempt < 4 && !room; attempt++) {
        const code = makeCode();
        const candidate: Room = {
          id: 'room-' + code, code, hostId: user!.userId,
          players: [{ userId: user!.userId, name, mark: 'X' }],
          board: Array(9).fill(''), currentTurn: 'X', status: 'waiting',
          winner: '', version: 1, createdAt: Date.now(), updatedAt: Date.now(),
        };
        const [id] = await db.tx.add(ROOMS, [candidate]);
        if (id) room = candidate;
      }
      if (!room) return error('Could not reserve a room code. Please retry.', 503);
      await ensureProfile(user!.userId, name);
      return json({ room: roomView(room) }, 201);
    },
  ],

  'GET /api/rooms/:code': [
    requireAuth(),
    async ({ user, params }) => {
      const room = await getRoom(params.code);
      if (!room) return error('Room not found. Check the code and try again.', 404);
      if (!room.players.some(player => player.userId === user!.userId)) return error('Join this room before viewing it.', 403);
      return json({ room: roomView(room) });
    },
  ],

  'POST /api/rooms/:code/join': [
    requireAuth(),
    async ({ user, params, body }) => {
      const room = await getRoom(params.code);
      if (!room) return error('Room not found. Check the code and try again.', 404);
      if (room.players.some(player => player.userId === user!.userId)) return json({ room: roomView(room) });
      if (room.status !== 'waiting' || room.players.length >= 2) return error('This room is already full or the match has started.', 409);
      const input = (body || {}) as { name?: string };
      const updatedRoom: Room = {
        ...room,
        players: [...room.players, { userId: user!.userId, name: cleanName(input.name, user!.name || 'Player'), mark: 'O' }],
        status: 'playing', version: room.version + 1, updatedAt: Date.now(),
      };
      const [ok] = await db.tx.update(ROOMS, [{ id: room.id, record: updatedRoom, if: { version: room.version, status: 'waiting' } }], { patch: true });
      if (!ok) return error('Someone joined first. Refresh and try another room.', 409);
      await ensureProfile(user!.userId, updatedRoom.players[1].name);
      await publishRoom(updatedRoom);
      return json({ room: roomView(updatedRoom) });
    },
  ],

  'POST /api/rooms/:code/move': [
    requireAuth(),
    async ({ user, params, body }) => {
      const room = await getRoom(params.code);
      if (!room) return error('Room not found.', 404);
      const player = room.players.find(item => item.userId === user!.userId);
      if (!player) return error('You are not a player in this room.', 403);
      if (room.status !== 'playing') return error('The match is not currently active.', 409);
      if (room.currentTurn !== player.mark) return error('It is not your turn.', 409);
      const input = (body || {}) as { index?: number };
      const index = input.index;
      if (!Number.isInteger(index) || index! < 0 || index! > 8 || room.board[index!] !== '') return error('That move is not valid.', 400);
      const board = [...room.board];
      board[index!] = player.mark;
      const won = LINES.some(([a,b,c]) => board[a] && board[a] === board[b] && board[a] === board[c]);
      const draw = !won && board.every(Boolean);
      const updatedRoom: Room = {
        ...room, board, currentTurn: player.mark === 'X' ? 'O' : 'X',
        status: won || draw ? 'completed' : 'playing',
        winner: won ? player.mark : draw ? 'draw' : '',
        version: room.version + 1, updatedAt: Date.now(),
      };
      const [ok] = await db.tx.update(ROOMS, [{
        id: room.id, record: updatedRoom,
        if: { version: room.version, currentTurn: player.mark, status: 'playing' },
      }], { patch: true });
      if (!ok) return error('The board changed before your move arrived. Please try again.', 409);
      if (updatedRoom.status === 'completed') await recordResult(updatedRoom);
      await publishRoom(updatedRoom);
      return json({ room: roomView(updatedRoom) });
    },
  ],
});
