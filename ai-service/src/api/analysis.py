"""
Music analysis API endpoints
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from pathlib import Path
import pretty_midi
import tempfile
from loguru import logger

from services.style_analyzer import StyleAnalyzer, GuitarStyle
from services.transcription_service import TranscriptionService

router = APIRouter()


class StyleAnalysisRequest(BaseModel):
    midi_data: Optional[str] = None  # Base64 encoded MIDI
    audio_features: Optional[Dict[str, Any]] = None


class StyleAnalysisResponse(BaseModel):
    features: Dict[str, float]
    style_matches: List[Dict[str, Any]]
    techniques: List[str]
    musical_analysis: Dict[str, Any]
    recommendations: List[str]


class TabGenerationRequest(BaseModel):
    midi_data: str  # Base64 encoded MIDI
    tuning: Optional[List[int]] = None
    capo: int = 0


class TabGenerationResponse(BaseModel):
    tuning: List[int]
    capo: int
    measures: List[Any]
    strings: List[List[Dict[str, Any]]]


@router.post("/style", response_model=StyleAnalysisResponse)
async def analyze_style(file: UploadFile = File(...)):
    """
    Analyze musical style from MIDI file
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(suffix='.mid', delete=False) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = Path(tmp_file.name)
        
        try:
            # Load MIDI
            midi_data = pretty_midi.PrettyMIDI(str(tmp_path))
            
            # Initialize analyzer
            analyzer = StyleAnalyzer()
            
            # Analyze style
            analysis = analyzer.analyze_style(midi_data)
            
            return StyleAnalysisResponse(**analysis)
            
        finally:
            # Clean up temp file
            tmp_path.unlink()
            
    except Exception as e:
        logger.error(f"Style analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/styles")
async def get_guitar_styles():
    """
    Get available guitar styles for analysis
    """
    styles = [
        {
            "id": style.name,
            "name": style.value,
            "description": get_style_description(style)
        }
        for style in GuitarStyle
    ]
    
    return {"styles": styles}


def get_style_description(style: GuitarStyle) -> str:
    """Get description for guitar style"""
    descriptions = {
        GuitarStyle.HENDRIX: "Psychedelic blues with innovative techniques, feedback, and explosive solos",
        GuitarStyle.PAGE: "Hard rock riffs with folk influences and studio experimentation",
        GuitarStyle.CLAPTON: "Pure blues with clean tones and melodic, emotional solos",
        GuitarStyle.BECK: "Fusion and experimental playing with extensive whammy bar use",
        GuitarStyle.GILMOUR: "Melodic and spacey with emotional bends and atmospheric effects",
        GuitarStyle.BLACKMORE: "Classical influences with fast runs and medieval harmonic choices",
        GuitarStyle.SANTANA: "Latin-influenced with sustained notes and singing melodic lines",
        GuitarStyle.VAN_HALEN: "Revolutionary tapping techniques with harmonics and innovation",
        GuitarStyle.SLASH: "Blues-rock with melodic solos and iconic Les Paul tone",
        GuitarStyle.MAY: "Orchestral arrangements with layered harmonies and unique tone"
    }
    return descriptions.get(style, "")


@router.post("/tab", response_model=TabGenerationResponse)
async def generate_tab(request: TabGenerationRequest):
    """
    Generate guitar tablature from MIDI
    """
    try:
        import base64
        import io
        
        # Decode MIDI data
        midi_bytes = base64.b64decode(request.midi_data)
        midi_file = io.BytesIO(midi_bytes)
        
        # Load MIDI
        midi_data = pretty_midi.PrettyMIDI(midi_file)
        
        # Initialize transcription service
        transcription_service = TranscriptionService()
        
        # Generate tablature
        tab_data = transcription_service.midi_to_tab(
            midi_data,
            tuning=request.tuning,
            capo=request.capo
        )
        
        return TabGenerationResponse(**tab_data)
        
    except Exception as e:
        logger.error(f"Tab generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/musicxml")
async def generate_musicxml(file: UploadFile = File(...)):
    """
    Generate MusicXML from MIDI file
    """
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(suffix='.mid', delete=False) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = Path(tmp_file.name)
        
        try:
            # Load MIDI
            midi_data = pretty_midi.PrettyMIDI(str(tmp_path))
            
            # Initialize transcription service
            transcription_service = TranscriptionService()
            
            # Generate MusicXML
            musicxml = transcription_service.generate_music_xml(
                midi_data,
                title=file.filename.replace('.mid', ''),
                composer="AI Transcribed"
            )
            
            return {
                "musicxml": musicxml,
                "filename": f"{file.filename.replace('.mid', '')}.musicxml"
            }
            
        finally:
            # Clean up temp file
            tmp_path.unlink()
            
    except Exception as e:
        logger.error(f"MusicXML generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/techniques")
async def get_guitar_techniques():
    """
    Get list of detectable guitar techniques
    """
    techniques = [
        {"id": "bending", "name": "String Bending", "description": "Pitch bending by pushing or pulling strings"},
        {"id": "vibrato", "name": "Vibrato", "description": "Rapid pitch variation for expression"},
        {"id": "slides", "name": "Slides", "description": "Sliding between notes on the same string"},
        {"id": "hammer_pull", "name": "Hammer-ons/Pull-offs", "description": "Legato technique without picking"},
        {"id": "tapping", "name": "Tapping", "description": "Two-handed tapping technique"},
        {"id": "harmonics", "name": "Harmonics", "description": "Natural and artificial harmonics"},
        {"id": "tremolo", "name": "Tremolo Picking", "description": "Rapid alternate picking"},
        {"id": "palm_mute", "name": "Palm Muting", "description": "Muted picking for percussive effect"},
        {"id": "arpeggios", "name": "Arpeggios", "description": "Broken chord patterns"},
        {"id": "power_chords", "name": "Power Chords", "description": "Root and fifth chord voicings"},
        {"id": "double_stops", "name": "Double Stops", "description": "Two notes played simultaneously"},
        {"id": "fast_runs", "name": "Fast Scale Runs", "description": "Rapid scalar passages"}
    ]
    
    return {"techniques": techniques}