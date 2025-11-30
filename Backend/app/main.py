from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routers import autocomplete, realtime, rooms
from .config import get_settings
from .db import init_db
from .services.realtime import RealtimeRoomHub
from .services.suggestions import SuggestionService

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.realtime_hub = RealtimeRoomHub()
    app.state.suggestion_service = SuggestionService(settings.suggestion_placeholder)
    await init_db()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin] if settings.frontend_origin else ['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*']
)

app.include_router(rooms.router)
app.include_router(autocomplete.router)
app.include_router(realtime.router)

@app.get('/healthz')
async def healthcheck() -> dict[str, str]:
    return {'status': 'ok'}
