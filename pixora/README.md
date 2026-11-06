# PIXORA — Enter the Playverse

Standalone React + Vite gaming portal deployable to Vercel without AppDeploy SDKs or a database.

## Current features
- Guest profile and scores saved in browser localStorage
- Memory Flux single-player game
- Two-player Tic-Tac-Toe on one device
- Responsive PIXORA dark gaming interface

## Not yet connected
Online rooms, real accounts, cross-device sync and global leaderboards require a backend. They are intentionally not simulated in this build. A future backend can be added without changing the current local game experience.

## Vercel
Set Root Directory to `pixora`, Framework Preset to Vite, Build Command to `npm run build`, Output Directory to `dist`. No environment variables are required.
