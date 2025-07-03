from pydantic_settings import BaseSettings
from typing import List, Optional
import secrets
import os


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Koutoubi AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./koutoubi.db"
    
    # Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    
    # AI/LLM
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "mistral:7b-instruct")
    LLM_TIMEOUT: int = int(os.getenv("LLM_TIMEOUT", "120"))  # 2 minutes pour les résumés longs
    LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "1000"))
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 10
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:3002"
    ]
    
    # Redis (optional for now)
    REDIS_URL: Optional[str] = None
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # Cache
    CACHE_ENABLED: bool = True
    CACHE_TTL: int = 3600  # 1 hour default
    
    # Content
    CONTENT_PATH: str = os.getenv("CONTENT_PATH", "./content")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()