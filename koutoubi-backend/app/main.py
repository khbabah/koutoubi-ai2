from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, chapters, flashcards, quiz, summary, explain, pdf_content, pdf_summary, content, pdf_viewer, pdf_chapter, mindmap, favorites, subscriptions, educational_content
from app.api import admin_router
from app.core.startup import startup_event
from app.api.explain import limiter
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - MUST be first
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Startup event
@app.on_event("startup")
async def on_startup():
    await startup_event()
    print(f"🔐 SECRET_KEY configured: {'Yes' if os.getenv('SECRET_KEY') else 'No (USING RANDOM!)'}")
    print(f"⏰ Token expires in: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(chapters.router, prefix="/api/v1/chapters", tags=["chapters"])
app.include_router(flashcards.router, prefix="/api/v1/flashcards", tags=["flashcards"])
app.include_router(quiz.router, prefix="/api/v1/quiz", tags=["quiz"])
app.include_router(summary.router, prefix="/api/v1/summary", tags=["summary"])
app.include_router(explain.router, prefix="/api/v1/explain", tags=["explain"])
app.include_router(pdf_content.router, prefix="/api/v1/pdf", tags=["pdf"])
app.include_router(pdf_summary.router, prefix="/api/v1/pdf-summary", tags=["pdf-summary"])
app.include_router(content.router, prefix="/api/v1/content", tags=["content"])
app.include_router(pdf_viewer.router, tags=["pdf-viewer"])
app.include_router(pdf_chapter.router, prefix="/api/v1/pdf-chapter", tags=["pdf-chapter"])

# Import the new extractor
from app.api import pdf_content_extractor
app.include_router(pdf_content_extractor.router, prefix="/api/v1/pdf-content", tags=["pdf-content"])
app.include_router(mindmap.router, prefix="/api/v1/mindmap", tags=["mindmap"])
app.include_router(favorites.router, prefix="/api/v1/favorites", tags=["favorites"])
app.include_router(subscriptions.router, prefix="/api/v1/subscriptions", tags=["subscriptions"])
app.include_router(educational_content.router, prefix="/api/v1/educational", tags=["educational"])

# Admin routes
app.include_router(admin_router.router, prefix="/api/v1/admin", tags=["admin"])

# Debug routes (remove in production)
if settings.DEBUG:
    from app.api import auth_debug
    app.include_router(auth_debug.router)

@app.get("/")
def read_root():
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": "SQLite (Development)",
        "secret_key_configured": bool(os.getenv("SECRET_KEY"))
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
