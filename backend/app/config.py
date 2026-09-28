"""Configuration settings for SynapseTV backend service with Multi-Tier LLM routing."""
from functools import lru_cache
from typing import List
import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment or defaults."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "SynapseTV Autonomous Living-Room Hub"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Multi-Tier Provider API Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    NEBIUS_API_KEY: str = os.getenv("NEBIUS_API_KEY", "")
    NEBIUS_BASE_URL: str = os.getenv("NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1")
    NEBIUS_MODEL: str = os.getenv("NEBIUS_MODEL", "Qwen/Qwen3-30B-A3B-Instruct-2507")

    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "anthropic/claude-sonnet-4.5")

    # AWS & Bedrock settings
    AWS_REGION: str = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_SESSION_TOKEN: str = os.getenv("AWS_SESSION_TOKEN", "")
    BEDROCK_SONNET_MODEL_ID: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    BEDROCK_HAIKU_MODEL_ID: str = "anthropic.claude-3-5-haiku-20241022-v1:0"
    FORCE_MOCK_BEDROCK: bool = False

    # Allowed CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]

    # Swarm Engine Tuning
    DISENGAGEMENT_THRESHOLD_SECONDS: float = 3.0
    CONFUSION_TRIGGER_THRESHOLD: float = 0.65
    EXPLAINER_COOLDOWN_SECONDS: float = 20.0
    WEBSOCKET_HEARTBEAT_INTERVAL: float = 5.0


@lru_cache()
def get_settings() -> Settings:
    return Settings()
