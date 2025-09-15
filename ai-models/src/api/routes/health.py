"""
Health check endpoints
"""

from fastapi import APIRouter, status
from datetime import datetime
import psutil
import torch

from core.redis_client import redis_client

router = APIRouter()

@router.get("/")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "transcription-service",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/detailed")
async def detailed_health():
    """Detailed health check with system info"""
    
    # Check Redis
    redis_status = "healthy"
    try:
        await redis_client.ping()
    except Exception:
        redis_status = "unhealthy"
    
    # Check GPU
    gpu_info = {}
    if torch.cuda.is_available():
        gpu_info = {
            "available": True,
            "device_count": torch.cuda.device_count(),
            "current_device": torch.cuda.current_device(),
            "device_name": torch.cuda.get_device_name(0),
            "memory_allocated": f"{torch.cuda.memory_allocated(0) / 1024**2:.2f} MB",
            "memory_reserved": f"{torch.cuda.memory_reserved(0) / 1024**2:.2f} MB"
        }
    else:
        gpu_info = {"available": False}
    
    # System info
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "redis": redis_status,
            "gpu": "available" if gpu_info.get("available") else "not available"
        },
        "system": {
            "cpu_usage": f"{cpu_percent}%",
            "memory": {
                "total": f"{memory.total / 1024**3:.2f} GB",
                "used": f"{memory.used / 1024**3:.2f} GB",
                "percent": f"{memory.percent}%"
            },
            "disk": {
                "total": f"{disk.total / 1024**3:.2f} GB",
                "used": f"{disk.used / 1024**3:.2f} GB",
                "percent": f"{disk.percent}%"
            }
        },
        "gpu": gpu_info
    }

@router.get("/ready")
async def readiness_check():
    """Check if service is ready to handle requests"""
    
    # Check all dependencies
    checks = {
        "redis": False,
        "model": False
    }
    
    # Check Redis
    try:
        await redis_client.ping()
        checks["redis"] = True
    except Exception:
        pass
    
    # Check if Basic Pitch model is accessible
    try:
        from basic_pitch import ICASSP_2022_MODEL_PATH
        checks["model"] = True
    except Exception:
        pass
    
    all_ready = all(checks.values())
    
    return {
        "ready": all_ready,
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    }, status.HTTP_200_OK if all_ready else status.HTTP_503_SERVICE_UNAVAILABLE