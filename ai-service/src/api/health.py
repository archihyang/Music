"""
Health check endpoints
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import redis
from loguru import logger

from config import settings

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    redis: bool
    celery: bool


@router.get("/", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint
    """
    # Check Redis connection
    redis_status = False
    try:
        r = redis.from_url(settings.redis_url)
        r.ping()
        redis_status = True
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
    
    # Check Celery (simplified check)
    celery_status = False
    try:
        from tasks.celery_app import celery_app
        i = celery_app.control.inspect()
        stats = i.stats()
        if stats:
            celery_status = True
    except Exception as e:
        logger.error(f"Celery health check failed: {e}")
    
    return HealthResponse(
        status="healthy" if redis_status else "degraded",
        service="Genesis Music AI Service",
        version="1.0.0",
        redis=redis_status,
        celery=celery_status
    )


@router.get("/ready")
async def readiness_check() -> Dict[str, Any]:
    """
    Readiness check for Kubernetes
    """
    # Check if all services are ready
    try:
        # Check Redis
        r = redis.from_url(settings.redis_url)
        r.ping()
        
        # Check Celery
        from tasks.celery_app import celery_app
        i = celery_app.control.inspect()
        stats = i.stats()
        
        if not stats:
            raise HTTPException(status_code=503, detail="Celery workers not ready")
        
        return {"ready": True, "message": "Service is ready"}
        
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Service not ready: {str(e)}")


@router.get("/live")
async def liveness_check() -> Dict[str, str]:
    """
    Liveness check for Kubernetes
    """
    return {"status": "alive"}