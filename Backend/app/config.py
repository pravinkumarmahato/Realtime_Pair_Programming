from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = 'Realtime Pair Programming API'
    database_url: str = Field(
        default='postgresql+asyncpg://postgres:postgres@localhost:5432/realtime_pair'
    )
    frontend_origin: str | None = None
    suggestion_placeholder: str = 'Consider extracting a helper function for clarity.'
    autocomplete_delay_ms: int = 600

    model_config = {
        'env_file': '.env',
        'env_prefix': 'PAIR_',
        'case_sensitive': False
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()
