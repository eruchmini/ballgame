# Ball Dodge Game

A multiplayer ball dodge game with boss battles, upgrades, and dynamic music.

## Features

- 🎮 Real-time multiplayer gameplay via WebSocket
- 👾 Epic boss battles with special attacks
- ⚡ Upgrade system (speed, multi-shot, explosions, tracking)
- 🎵 Dynamic background music and sound effects
- 💥 Particle effects and visual polish
- 🎯 Multiple ball types (tracking, bouncing, shield)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Controls

- **WASD** or **Arrow Keys**: Move player
- **Mouse Click**: Shoot at cursor position
- **Music Toggle**: Toggle sound on/off

## Game Mechanics

- Dodge falling balls to survive
- Shoot balls to gain points
- Collect blue balls for shields
- Reach 500 points to trigger boss battle
- Earn upgrade points every 100 points

## Project Structure

```
src/
├── components/          # React UI components
├── game/
│   ├── classes/        # Game entity classes
│   ├── audio/          # Sound and music systems
│   ├── multiplayer/    # WebSocket multiplayer
│   ├── particles/      # Particle effect systems
│   └── constants.js    # Game configuration
├── App.jsx             # App entry point
└── index.jsx           # React entry point
```
