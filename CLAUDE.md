# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js multiplayer quiz/classroom game server using Socket.IO for real-time communication. The application creates virtual classrooms where teachers can host quizzes, manage discussions, and use interactive whiteboards.

## Development Commands

**Start the server:**
```bash
node index.js
```

**Development with auto-restart:**
```bash
npx nodemon index.js
```

**Install dependencies:**
```bash
npm install
```

Note: There are no configured test, lint, or build scripts in package.json.

## Architecture

### Core Components

- **Server.js** - Main server logic handling lobby management, player connections, and game state
- **Connection.js** - Manages Socket.IO event handlers for each connected client
- **Player.js** - Player entity with position, lobby assignment, and user data
- **GameLobby.js** - Extends LobbyBase for classroom/quiz functionality
- **LobbyBase.js** - Base lobby functionality for player management

### Key Features

1. **Multi-lobby System**: Teachers create lobbies (classrooms), students join them
2. **Discussion Groups**: Teachers can split students into smaller discussion rooms
3. **Interactive Whiteboard**: Real-time collaborative drawing with privilege management
4. **Quiz System**: Integration with external API for quiz submission/answers
5. **Position Tracking**: Virtual classroom with seat assignments and movement

### Socket.IO Events

**Authentication & Lobby Management:**
- `createLobby` - Teacher login and classroom creation
- `joinLobby` - Student joins existing classroom
- `buatDiskusi` - Split into discussion groups
- `returnToKelas` - Return to main classroom

**Interactive Features:**
- `raiseHand` - Student attention request
- `globalMute` - Teacher mutes all students
- `updatePosition` - Player movement tracking
- `updateKursi` - Seat assignment changes

**Whiteboard:**
- `openWhiteboard`/`closeWhiteboard` - Toggle whiteboard access
- `drawWhiteboard` - Real-time drawing data
- `textWhiteboard`/`shapeWhiteboard` - Text and shape tools
- `wbChange` - Change drawing privileges

**Quiz System:**
- `submitSoal` - Teacher submits questions
- `submitJawaban` - Student submits answers

### External Dependencies

- **Socket.IO 2.1.1** - Real-time communication
- **nanoid** - Unique ID generation for players
- **axios** - HTTP requests to quiz/authentication API
- **nodemon** - Development auto-restart

### External API Integration

The server integrates with `http://103.181.142.138:8000` for:
- Teacher authentication (`/login-game`)
- Quiz management (`/submit-soal`, `/submit-jawaban`)
- Book resources (`/list-buku`, `/download-buku`, `/search-buku`)

### Development Notes

- Server runs on port 4000
- Health monitoring endpoint on port 4001 (/health, /metrics, /memory)
- Event-driven architecture (removed 100ms update loop for performance)
- Player IDs use nanoid with custom alphabet (6 characters)
- No database - all state is in-memory with enhanced cleanup
- Teacher type = 1, Student type = 99 (default)

### Performance Optimizations

- **HTTP Client**: Singleton axios instance with connection pooling and caching
- **Event Throttling**: Position updates limited to 10/sec, whiteboard to 20/sec
- **Memory Management**: Automatic cleanup every 5 minutes, connection limits (50/lobby)
- **Modular Architecture**: Event handlers split into focused modules
- **Error Handling**: Comprehensive logging with Winston, circuit breakers for APIs
- **Monitoring**: Real-time health checks and performance metrics