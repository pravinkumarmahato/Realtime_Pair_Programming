# Realtime Pair Programming

Collaborative coding environment that pairs a FastAPI backend with a Vite/React frontend. Users can create or join rooms, edit code together in real time, and request lightweight AI suggestions.

## [Deployed Demo: http://34.180.18.81/](http://34.180.18.81/)

## [Demo Video: https://youtu.be/cVTZqgDB4O8](https://youtu.be/cVTZqgDB4O8)

## Screenshots

> <Screenshots/Images>

## High-Level Architecture

- **Backend** (`Backend/`): FastAPI application with REST + WebSocket endpoints, backed by SQLAlchemy and PostgreSQL. Handles room lifecycle, synchronization, and autocomplete stubs.
- **Frontend** (`Frontend/`): React + TypeScript SPA rendered via Vite. Uses Monaco editor, Redux Toolkit store, and a thin WebSocket client for live updates.
- **Infrastructure**: Docker Compose spins up the API container and a PostgreSQL service for local parity. Tests run against SQLite via `aiosqlite` for speed.

### Repository Walkthrough
- `Backend/app/main.py`: FastAPI entry point wiring middleware, routers, and lifespan-managed services.
- `Backend/app/services/rooms.py`: Encapsulates persistence for room creation, lookup, and code updates.
- `Backend/app/services/realtime.py`: In-memory hub coordinating WebSocket connections and broadcasts.
- `Backend/tests/test_websocket.py`: Integration test proving code deltas propagate between clients.
- `Frontend/src/App.tsx`: Scene composition that leans on hooks for routing + realtime orchestration.
- `Frontend/src/hooks/useRoomConnection.ts`: Abstracts WebSocket lifecycle, dispatching Redux updates on events.
- `Frontend/src/store/roomSlice.ts`: Single Redux slice holding room metadata, participants, and suggestion state.

## Running the Services

Follow the same order every time so dependencies are ready before the UI boots:

1. **Terminal #1 – Backend + PostgreSQL**
	```bash
	docker compose up --build
	```
	- Brings up the FastAPI container on `http://localhost:8000` and PostgreSQL on `localhost:5432`.
	- Hot reload is available via the bind mount in `docker-compose.yml`, so editing files under `Backend/` or `app/` reflects immediately.

2. **Terminal #2 – Frontend React App**
	```bash
	cd Frontend
	npm install          # first run only
	npm run dev
	```
	- Vite serves the SPA at `http://localhost:5173` and proxies API/WebSocket calls to the compose backend.

3. **Environment Variables (both terminals)**
	- Backend: verify `Backend/.env` contains the `PAIR_*` settings listed below. Docker Compose already injects matching defaults, but local shells need the file or manual exports.
	- Frontend: ensure `Frontend/.env` declares `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` so Vite points to `http://localhost:8000`/`ws://localhost:8000`.

## Backend

### Tech Stack
- Python 3.11+
- FastAPI + Pydantic + Uvicorn
- SQLAlchemy 2.x (async engine) with asyncpg (Postgres) or aiosqlite (tests)
- WebSockets (FastAPI `WebSocket` endpoints)
- Pytest for integration testing

### Project Structure
```
Backend/
	app/
		api/routers      # REST + WebSocket routes
		services/        # Domain logic (rooms, realtime hub, suggestions)
		schemas/         # Pydantic models for payload validation
		models/          # SQLAlchemy ORM entities
		config.py        # Pydantic settings entry point
		main.py          # FastAPI application factory with lifespan hooks
	tests/
		test_websocket.py
	requirements.txt
	Dockerfile
```

### Configuration
Environment variables are prefixed with `PAIR_` and can be set in a `.env` file.

#### Setting Backend Environment Variables
1. Create `Backend/.env` (ignored by git) and add the values:
	```ini
	PAIR_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/realtime_pair
	PAIR_FRONTEND_ORIGIN=http://localhost:5173
	```
2. When running via `docker compose`, these defaults already match the compose services. Override as needed (e.g., different DB credentials).
3. For ad-hoc testing, temporarily export variables in your shell:
	```bash
	set PAIR_DATABASE_URL=sqlite+aiosqlite:///./dev.db   # Windows cmd
	export PAIR_DATABASE_URL=sqlite+aiosqlite:///./dev.db # PowerShell: $env:PAIR_DATABASE_URL="..."
	```

### API Surface
The server boots on `http://localhost:8000` (or `backend:8000` in Docker) and exposes:
- `GET /healthz`
- `POST /rooms`
- `GET /rooms/{room_id}`
- `POST /autocomplete`
- `WS /ws/{room_id}`

### Tests
```bash
cd Backend
.venv\Scripts\python -m pytest
```
`tests/test_websocket.py` spins up a TestClient, persists state to the ephemeral SQLite DB, and asserts that broadcasts propagate between two WebSocket clients.

## Frontend

### Tech Stack
- Node 20+
- Vite + React + TypeScript
- Redux Toolkit for state management
- Monaco Editor for code editing

### Project Structure
```
Frontend/
	src/
		components/      # Room controls, editor, suggestion panel, status bar
		hooks/           # Shared hooks (store, routing, websocket connection)
		services/        # WebSocket client
		store/           # Redux slice + store setup
		styles/          # Global styles
		config.ts        # API/WS base URL helpers
	package.json
	vite.config.ts
```

### Environment
Create a `.env` or `.env.local` in `Frontend/` as needed:
```
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```
The `src/config.ts` helper normalizes trailing slashes and provides stable endpoints to the Redux thunks and WebSocket client.

Load order tips:
- Vite automatically reads `.env`, `.env.local`, and mode-specific variants. Commit only the sample template (e.g., `.env.example`) if you need to share defaults.
- When running `npm run dev`, verify the terminal prints the resolved `VITE_*` variables so you know the frontend is pointing at the Docker backend.

### Runtime
Run `npm run dev` then visit `http://localhost:5173`. Creating or joining a room triggers:
- REST call to `/rooms` (create) or direct navigation (join)
- WebSocket subscription via `useRoomConnection`
- Monaco editor updates broadcasting through `pushCodeChange`

### Available Scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server with hot reload. |
| `npm run build` | Production build. |
| `npm run preview` | Serve the production build locally. |

## End-to-End Flow
1. User picks/enters a display name in the Room Panel.
2. `createRoom` thunk hits `/rooms`; backend seeds DB + in-memory hub state.
3. `useRoomConnection` opens `ws://.../ws/{room}`; backend `RealtimeRoomHub` tracks connections and broadcasts participant counts + buffer sync.
4. Editor changes dispatch `pushCodeChange`, which backend validates via `RealtimeUpdate` schema, persists via `RoomService`, and rebroadcasts.
5. Debounced code snapshots trigger `fetchAutocomplete`, returning placeholder hints from `SuggestionService`.

## Architecture & Design Choices
- **Lifespan-managed services**: FastAPI `lifespan` wires the realtime hub + suggestion service once, avoiding repeated startup logic per test.
- **In-memory hub + persistent store**: Room state stays durable in Postgres, while the `RealtimeRoomHub` manages transient WebSocket connections for low-latency broadcasts.
- **Redux + hooks**: Custom hooks (`useRoomRouting`, `useRoomConnection`) isolate side effects, keeping `App.tsx` declarative and testable.
- **Configuration helpers**: `src/config.ts` normalizes API/WS URLs so every consumer honors the same environment contract.
- **SQLite-backed tests**: Pytest switches to `aiosqlite` for isolated runs, avoiding heavy Postgres fixtures while covering the websocket lifecycle end-to-end.

## Limitations
- No authentication/authorization; anyone with a room ID can join.
- Single in-memory hub instance; horizontal scaling would require shared state (Redis/pub-sub) or sticky sessions.
- Autocomplete is a placeholder that returns canned hints; no real AI inference pipeline yet.
- Browser-only client; no mobile layout optimizations.

## Improvements with More Time
1. **Model integration**: swap the placeholder suggestion service with a hosted LLM (Azure OpenAI, local `ollama`, etc.) and stream completions back to the client.
2. **Operational hardening**: add logging/metrics, health probes for WebSocket saturation, and CI workflows (lint/test).
3. **Scalability**: introduce Redis for pub/sub fan-out, Room sharding, and background workers for persistence.
4. **Collaboration features**: cursors, presence indicators, conflict resolution (CRDT/OT) rather than broadcasting whole buffers.
5. **Testing depth**: add contract tests for REST APIs, Vitest suites for hooks/components, and load tests for websocket throughput.
