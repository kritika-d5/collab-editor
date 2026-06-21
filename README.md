# Collab Editor

A real-time collaborative code editor — multiple users can join a shared session, edit code simultaneously with live cursor presence, chat, run code, view edit history, and approve/reject incoming users, all synced instantly with no conflicts.

**Live demo:** [collab-editor-frontend-six.vercel.app](https://collab-editor-frontend-six.vercel.app)

**Backend health check:** [collab-editor-backend-m83w.onrender.com/health](https://collab-editor-backend-m83w.onrender.com/health)

> Note: the backend runs on Render's free tier, which spins down after 15 minutes of inactivity. The first request after idle time may take 30–50 seconds to wake up.

<img width="600" alt="image" src="https://github.com/user-attachments/assets/5d1d9488-4af3-4b1a-8db2-84beaa86c6cb" />

---

## Features

- **Real-time collaboration** — Yjs CRDT sync with zero conflicts, live cursor presence with per-user colors, Monaco Editor (the engine behind VS Code) with syntax highlighting across 8 languages
- **Authentication** — JWT access + refresh tokens, with automatic silent refresh so sessions never interrupt the user
- **Chat** — real-time per-room chat via Socket.io, with automatic reconnection on token expiry
- **Room lobby** — non-owners request access; the room owner can accept or reject joiners in real time
- **Run code** — execute JavaScript, TypeScript, Python, Go, or Rust directly in the browser via Judge0, with an output panel showing stdout/stderr/execution time
- **History & restore** — debounced snapshot saving and a timeline scrubber to preview and restore any past state
- **Polished UI/UX** — dark/light theme, presence bar, status bar, shareable links, download-as-file

---
<img width="800" alt="image" src="https://github.com/user-attachments/assets/063437c2-5a95-4916-8daa-b8dbd3697ea2" />
<img width="800" alt="image" src="https://github.com/user-attachments/assets/e324a3d9-cc51-4c1f-956c-c0919e7e2104" />

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Editor | Monaco Editor |
| Real-time sync | Yjs (CRDT) + y-websocket |
| Cursor presence | y-protocols/awareness |
| Chat + Lobby | Socket.io |
| Backend | Node.js + Express + TypeScript |
| Auth | JWT (15min access + 7d refresh) + bcrypt |
| Database | PostgreSQL ([Neon](https://neon.tech)) |
| Cache | Redis ([Upstash](https://upstash.com)) |
| Code execution | [Judge0](https://judge0.com) |
| Validation | Zod |
| Logging | Pino |
| CI | GitHub Actions |
| Hosting | [Render](https://render.com) (backend) + [Vercel](https://vercel.com) (frontend) |

---

## Architecture

```
Browser
   │
   ▼
Vercel (React + Vite, static)
   │  REST + WebSocket
   ▼
Render (Node.js + Express + Socket.io)
   │
   ├── Neon PostgreSQL — users, sessions, operations
   └── Upstash Redis — refresh tokens, lobby approvals, Socket.io state
```

---

## Folder Structure

```
collab-editor/
├── .github/workflows/ci.yml      # lint, build, docker build on push
├── backend/
│   ├── src/
│   │   ├── collab/
│   │   │   ├── yjsServer.ts      # Yjs WebSocket server, room isolation, JWT auth guard
│   │   │   └── chatServer.ts     # Socket.io chat + lobby events
│   │   ├── config/env.ts
│   │   ├── db/
│   │   │   ├── postgres.ts
│   │   │   ├── redis.ts
│   │   │   ├── migrate.ts
│   │   │   └── migrations/
│   │   ├── lib/
│   │   │   ├── validate.ts       # Zod schemas + middleware
│   │   │   ├── logger.ts         # Pino structured logging
│   │   │   └── lobby.ts          # session access control
│   │   ├── middleware/auth.ts
│   │   ├── routes/
│   │   │   ├── auth.ts           # register, login, refresh, logout
│   │   │   ├── sessions.ts       # CRUD + history endpoint
│   │   │   └── execute.ts        # Judge0 code execution
│   │   └── index.ts
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatSidebar.tsx       # chat panel with auto token refresh
│   │   │   ├── HistoryTimeline.tsx
│   │   │   ├── LobbyScreen.tsx
│   │   │   ├── PresenceBar.tsx
│   │   │   ├── OutputPanel.tsx       # code execution output
│   │   │   └── ErrorBoundary.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # token state + silent refresh hook
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/useCollabEditor.ts  # Yjs + Monaco binding
│   │   ├── lib/api.ts                # axios instance + 401 refresh interceptor
│   │   ├── pages/
│   │   │   ├── Editor.tsx
│   │   │   ├── Landing.tsx
│   │   │   └── Login.tsx
│   │   └── router/ProtectedRoute.tsx
│   └── vercel.json                   # SPA rewrite rule
└── docker-compose.yml                # local dev only
```

---

## Database Schema

```sql
users (
  id UUID PRIMARY KEY,
  username VARCHAR(32) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password TEXT,              -- bcrypt hashed
  created_at TIMESTAMPTZ
)

sessions (
  id UUID PRIMARY KEY,
  slug VARCHAR(12) UNIQUE,    -- shareable room ID
  owner_id UUID → users,
  language VARCHAR(32),
  doc_state BYTEA,            -- serialized Yjs document
  created_at TIMESTAMPTZ
)

operations (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID → sessions,
  seq INTEGER,
  payload BYTEA,              -- full Yjs state snapshot
  user_id UUID → users,
  created_at TIMESTAMPTZ
)
```

---

## Security

- Rate limiting on auth routes (10 attempts / 15 min / IP)
- Request body validation via Zod on all auth and session-creation routes
- WebSocket connections (`/yjs` and `/chat`) require a valid JWT before any room access is granted
- Structured JSON logging via Pino
- Passwords hashed with bcrypt (12 rounds)
- Short-lived access tokens (15 min) with silent refresh via long-lived refresh tokens (7 days, stored in Redis) — both over HTTP (axios interceptor) and WebSocket (chat reconnect-on-auth-failure)

---

## Local Development

```bash
# Backend stack (Postgres, Redis, backend) via Docker
cd collab-editor
docker compose up postgres redis backend

# Frontend (runs natively for reliable hot reload)
cd frontend
npm run dev

# Run migrations
docker compose exec backend npm run migrate
```

### Environment Variables

```env
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=long_random_string
JWT_REFRESH_SECRET=another_long_random_string
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

---

## Deployment

Currently deployed across four free-tier services:

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys on push to `main`; SPA rewrites via `vercel.json` |
| Backend | Render | Auto-deploys on push to `main`; free tier spins down after 15 min idle |
| PostgreSQL | Neon | 0.5GB free tier |
| Redis | Upstash | TCP/TLS connection (`rediss://`), 10k commands/day free |

Both Render and Vercel auto-deploy on every push to `main` via their native GitHub integration — no separate CD pipeline needed.

---

## Known Limitations

- Render's free tier cold-starts after inactivity (~30–50s wake-up)
- Judge0 free public instance is shared and may be slower under load
- History timeline shows sequence numbers rather than formatted timestamps
- No session password protection yet (planned)

---
