# PIXORA — Enter the Playverse

PIXORA is a multiplayer gaming portal with account sign-in, player profiles, private room codes, real-time Tic-Tac-Toe, a global leaderboard, and the Memory Flux mini-game.

## Live app

https://pixora-vvabva.v2.appdeploy.ai/

## Source layout

This directory contains the PIXORA AppDeploy source snapshot. It is intentionally kept separate from the Snake game at the repository root.

- `src/` — React + TypeScript frontend
- `backend/` — authenticated profile, room, leaderboard and realtime subscription APIs
- `tests/tests.json` — smoke-test scenarios
- `vite.config.ts`, `tsconfig.json`, `tailwind.config.js` — frontend configuration

## Runtime

The app uses the AppDeploy runtime packages `@appdeploy/client` and `@appdeploy/sdk` for authentication, API access, database operations and WebSocket updates. Deploy this source through the AppDeploy platform; it is not a standalone Vite build without those runtime packages and services.

## Multiplayer test

Use two separate authenticated accounts or browser sessions:
1. Create a room with player A.
2. Join the six-character room code with player B.
3. Confirm each move appears on both boards and that out-of-turn moves are rejected.
4. Finish a match and check the leaderboard.

The automated QA snapshot passed its static checks; a full two-account end-to-end match should still be verified.
