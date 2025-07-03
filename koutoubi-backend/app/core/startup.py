"""
Startup checks and initialization
"""
import logging
import asyncio
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)


async def check_dependencies():
    """Check all required dependencies on startup"""
    
    # Check Ollama
    logger.info("Checking Ollama status...")
    ollama_ok = await llm_service.check_ollama_health()
    
    if not ollama_ok:
        logger.warning(
            "Ollama is not running or Mistral model is not available. "
            "AI features will not work properly. "
            "Please run: ollama pull mistral:7b-instruct && ollama serve"
        )
    else:
        logger.info("Ollama is ready with Mistral model")
    
    return {
        "ollama": ollama_ok
    }


async def startup_event():
    """Run startup checks"""
    try:
        status = await check_dependencies()
        logger.info(f"Startup checks completed: {status}")
    except Exception as e:
        logger.error(f"Error during startup checks: {str(e)}")