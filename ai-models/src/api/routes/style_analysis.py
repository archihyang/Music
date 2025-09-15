"""
Style Analysis API Routes
70-80년대 기타리스트 스타일 분석 엔드포인트
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import tempfile
import os
from pathlib import Path
import logging
import uuid

from ...style_analyzer import StyleAnalysisService
from ...core.redis_client import redis_client

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize style analysis service
style_service = StyleAnalysisService()


@router.post("/analyze")
async def analyze_style(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None
) -> Dict[str, Any]:
    """
    오디오 파일의 기타 스타일 분석
    
    70-80년대 레전드 기타리스트들과 비교하여 스타일 매칭
    """
    
    # Validate file type
    allowed_types = [
        'audio/wav', 'audio/x-wav',
        'audio/mp3', 'audio/mpeg',
        'audio/m4a', 'audio/x-m4a',
        'audio/ogg', 'audio/flac'
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}"
        )
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Perform style analysis
        result = await style_service.analyze_file(tmp_path)
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=result.get('error', 'Style analysis failed')
            )
        
        # Store result in Redis for caching
        job_id = str(uuid.uuid4())
        await redis_client.setex(
            f"style_analysis:{job_id}",
            3600,  # 1 hour TTL
            result
        )
        
        return {
            'job_id': job_id,
            'success': True,
            'analysis': result['analysis']
        }
        
    except Exception as e:
        logger.error(f"Style analysis error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/analyze/midi")
async def analyze_midi_style(
    file: UploadFile = File(...)
) -> Dict[str, Any]:
    """
    MIDI 파일의 스타일 분석
    """
    
    if not file.filename.lower().endswith(('.mid', '.midi')):
        raise HTTPException(
            status_code=400,
            detail="File must be a MIDI file"
        )
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mid') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Analyze MIDI
        result = await style_service.analyze_midi(tmp_path)
        
        return {
            'success': True,
            'analysis': result['analysis']
        }
        
    except Exception as e:
        logger.error(f"MIDI analysis error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"MIDI analysis failed: {str(e)}"
        )
    finally:
        # Clean up
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.get("/analyze/status/{job_id}")
async def get_analysis_status(job_id: str) -> Dict[str, Any]:
    """
    스타일 분석 작업 상태 확인
    """
    
    # Check Redis for cached result
    result = await redis_client.get(f"style_analysis:{job_id}")
    
    if not result:
        raise HTTPException(
            status_code=404,
            detail="Analysis job not found or expired"
        )
    
    return result


@router.get("/legends")
async def get_guitar_legends() -> Dict[str, Any]:
    """
    지원되는 70-80년대 기타 레전드 목록
    """
    
    from ...style_analyzer import GUITAR_LEGENDS
    
    legends = []
    for key, info in GUITAR_LEGENDS.items():
        legends.append({
            'id': key,
            'name': info['name'],
            'band': info['band'],
            'style_features': info['style_features'],
            'signature_techniques': info['signature_techniques']
        })
    
    return {
        'legends': legends,
        'total': len(legends)
    }


@router.post("/compare")
async def compare_with_legend(
    file: UploadFile = File(...),
    legend_id: str = None
) -> Dict[str, Any]:
    """
    특정 레전드와 스타일 비교
    """
    
    from ...style_analyzer import GUITAR_LEGENDS
    
    if legend_id and legend_id not in GUITAR_LEGENDS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown legend ID: {legend_id}"
        )
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    try:
        # Analyze file
        result = await style_service.analyze_file(tmp_path)
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail="Style analysis failed"
            )
        
        analysis = result['analysis']
        
        # If specific legend requested, find similarity
        if legend_id:
            legend_info = GUITAR_LEGENDS[legend_id]
            
            # Find this legend in matched legends
            legend_match = next(
                (m for m in analysis['matched_legends'] 
                 if m['name'] == legend_info['name']),
                None
            )
            
            if legend_match:
                similarity = legend_match['similarity']
            else:
                similarity = 0.0
            
            # Generate specific recommendations
            recommendations = []
            
            if similarity < 50:
                recommendations.append(
                    f"{legend_info['name']}의 스타일과 차이가 큽니다. "
                    f"주요 테크닉을 연습해보세요: {', '.join(legend_info['signature_techniques'][:3])}"
                )
            elif similarity < 80:
                recommendations.append(
                    f"{legend_info['name']}의 스타일과 유사합니다. "
                    f"더 가까워지려면 {legend_info['signature_techniques'][0]}을(를) 강화하세요."
                )
            else:
                recommendations.append(
                    f"훌륭합니다! {legend_info['name']}의 스타일을 잘 재현하고 있습니다."
                )
            
            # Technique comparison
            missing_techniques = [
                t for t in legend_info['signature_techniques']
                if not any(dt['name'] == t for dt in analysis['techniques'])
            ]
            
            if missing_techniques:
                recommendations.append(
                    f"다음 테크닉을 추가하면 더 authentic해집니다: {', '.join(missing_techniques[:2])}"
                )
            
            return {
                'success': True,
                'legend': legend_info,
                'similarity': similarity,
                'analysis': analysis,
                'recommendations': recommendations + analysis['recommendations'][:3]
            }
        
        return {
            'success': True,
            'analysis': analysis
        }
        
    except Exception as e:
        logger.error(f"Comparison error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Comparison failed: {str(e)}"
        )
    finally:
        # Clean up
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/feedback")
async def submit_style_feedback(
    job_id: str,
    correct_style: Optional[str] = None,
    correct_legend: Optional[str] = None,
    user_rating: Optional[int] = None
) -> Dict[str, Any]:
    """
    스타일 분석 결과에 대한 사용자 피드백
    (모델 개선을 위한 데이터 수집)
    """
    
    feedback_data = {
        'job_id': job_id,
        'correct_style': correct_style,
        'correct_legend': correct_legend,
        'user_rating': user_rating
    }
    
    # Store feedback in Redis for later processing
    await redis_client.lpush('style_feedback', feedback_data)
    
    return {
        'success': True,
        'message': 'Feedback received. Thank you for helping improve our model!'
    }


@router.get("/techniques")
async def get_available_techniques() -> Dict[str, Any]:
    """
    감지 가능한 기타 테크닉 목록
    """
    
    techniques = [
        {
            'id': 'bending',
            'name': 'Bending',
            'description': '현을 밀어 올려 음정을 변화시키는 테크닉',
            'difficulty': 'intermediate'
        },
        {
            'id': 'vibrato',
            'name': 'Vibrato',
            'description': '음을 떨리게 하여 표현력을 높이는 테크닉',
            'difficulty': 'intermediate'
        },
        {
            'id': 'slide',
            'name': 'Slide',
            'description': '한 프렛에서 다른 프렛으로 미끄러지듯 이동',
            'difficulty': 'beginner'
        },
        {
            'id': 'hammer_on',
            'name': 'Hammer-On',
            'description': '피킹 없이 왼손으로 음을 만드는 테크닉',
            'difficulty': 'beginner'
        },
        {
            'id': 'pull_off',
            'name': 'Pull-Off',
            'description': '현을 튕겨서 음을 만드는 테크닉',
            'difficulty': 'beginner'
        },
        {
            'id': 'tapping',
            'name': 'Tapping',
            'description': '오른손으로 프렛보드를 두드려 음을 만드는 테크닉',
            'difficulty': 'advanced'
        },
        {
            'id': 'harmonics',
            'name': 'Harmonics',
            'description': '배음을 이용한 맑은 음색 생성',
            'difficulty': 'advanced'
        },
        {
            'id': 'palm_muting',
            'name': 'Palm Muting',
            'description': '손바닥으로 현을 살짝 막아 음을 죽이는 테크닉',
            'difficulty': 'beginner'
        },
        {
            'id': 'tremolo_picking',
            'name': 'Tremolo Picking',
            'description': '매우 빠른 연속 피킹',
            'difficulty': 'intermediate'
        },
        {
            'id': 'sweep_picking',
            'name': 'Sweep Picking',
            'description': '여러 현을 한 번의 움직임으로 연주',
            'difficulty': 'advanced'
        }
    ]
    
    return {
        'techniques': techniques,
        'total': len(techniques)
    }