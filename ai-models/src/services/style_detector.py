"""
Style Detector Service
Detects guitarist playing style based on audio features
Specialized for 70-80s rock/metal guitarists
"""

import numpy as np
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class GuitaristStyle(Enum):
    YNGWIE_MALMSTEEN = "yngwie_malmsteen"
    RANDY_RHOADS = "randy_rhoads"
    JAMES_HETFIELD = "james_hetfield"
    JOHN_PETRUCCI = "john_petrucci"
    ERIC_CLAPTON = "eric_clapton"
    UNKNOWN = "unknown"

@dataclass
class StyleFeatures:
    """Features that characterize a guitarist's style"""
    speed_bpm: float
    note_density: float
    vibrato_rate: float
    bend_frequency: float
    palm_mute_ratio: float
    legato_ratio: float
    scale_patterns: List[str]
    common_intervals: List[int]
    rhythm_complexity: float
    harmonic_complexity: float

class StyleDetector:
    def __init__(self):
        self.style_profiles = self._load_style_profiles()
        self.ready = True
    
    def is_ready(self) -> bool:
        """Check if service is ready"""
        return self.ready
    
    def _load_style_profiles(self) -> Dict[GuitaristStyle, StyleFeatures]:
        """Load predefined style profiles for each guitarist"""
        return {
            GuitaristStyle.YNGWIE_MALMSTEEN: StyleFeatures(
                speed_bpm=180,  # Fast neoclassical runs
                note_density=0.8,  # High note density
                vibrato_rate=6.0,  # Fast, wide vibrato
                bend_frequency=0.1,  # Less bending, more scales
                palm_mute_ratio=0.1,  # Minimal palm muting
                legato_ratio=0.3,  # Some legato, mostly picked
                scale_patterns=['harmonic_minor', 'phrygian_dominant', 'diminished'],
                common_intervals=[3, 4, 5, 7, 12],  # Thirds, fourths, fifths, octaves
                rhythm_complexity=0.4,  # Focus on lead
                harmonic_complexity=0.8  # Complex harmony
            ),
            
            GuitaristStyle.RANDY_RHOADS: StyleFeatures(
                speed_bpm=140,
                note_density=0.6,
                vibrato_rate=5.0,
                bend_frequency=0.3,
                palm_mute_ratio=0.3,
                legato_ratio=0.4,
                scale_patterns=['natural_minor', 'harmonic_minor', 'major'],
                common_intervals=[3, 4, 5, 8, 12],
                rhythm_complexity=0.6,
                harmonic_complexity=0.7
            ),
            
            GuitaristStyle.JAMES_HETFIELD: StyleFeatures(
                speed_bpm=200,  # Fast downpicking
                note_density=0.4,  # Lower for rhythm
                vibrato_rate=2.0,  # Less vibrato
                bend_frequency=0.1,
                palm_mute_ratio=0.7,  # Heavy palm muting
                legato_ratio=0.1,  # Mostly picked
                scale_patterns=['pentatonic_minor', 'chromatic'],
                common_intervals=[1, 2, 5, 7, 12],  # Power chords, chromatic
                rhythm_complexity=0.9,  # Complex rhythms
                harmonic_complexity=0.3  # Simple harmony (power chords)
            ),
            
            GuitaristStyle.JOHN_PETRUCCI: StyleFeatures(
                speed_bpm=160,
                note_density=0.7,
                vibrato_rate=5.5,
                bend_frequency=0.2,
                palm_mute_ratio=0.4,
                legato_ratio=0.5,  # Balanced picking and legato
                scale_patterns=['all'],  # Uses everything
                common_intervals=[2, 3, 4, 5, 6, 7, 9, 11],  # Complex intervals
                rhythm_complexity=0.9,  # Odd time signatures
                harmonic_complexity=0.9  # Very complex
            ),
            
            GuitaristStyle.ERIC_CLAPTON: StyleFeatures(
                speed_bpm=100,
                note_density=0.3,  # Sparse, bluesy
                vibrato_rate=4.0,
                bend_frequency=0.6,  # Lots of bending
                palm_mute_ratio=0.2,
                legato_ratio=0.5,
                scale_patterns=['pentatonic_minor', 'blues', 'major_pentatonic'],
                common_intervals=[3, 4, 5, 7],  # Blues intervals
                rhythm_complexity=0.5,
                harmonic_complexity=0.4  # Blues simplicity
            )
        }
    
    async def detect(self, audio_features: Dict) -> Dict:
        """
        Detect guitarist style from audio features
        
        Args:
            audio_features: Extracted audio features
            
        Returns:
            Style detection results
        """
        try:
            # Extract style features from audio
            extracted_features = self._extract_style_features(audio_features)
            
            # Compare with known profiles
            similarities = {}
            for style, profile in self.style_profiles.items():
                similarity = self._calculate_similarity(
                    extracted_features,
                    profile
                )
                similarities[style.value] = similarity
            
            # Find best match
            best_match = max(similarities, key=similarities.get)
            confidence = similarities[best_match]
            
            # Get detailed analysis
            analysis = self._analyze_techniques(
                extracted_features,
                GuitaristStyle(best_match)
            )
            
            return {
                'detected_style': best_match,
                'confidence': confidence,
                'similarities': similarities,
                'techniques_detected': analysis['techniques'],
                'style_characteristics': analysis['characteristics'],
                'recommendations': self._get_practice_recommendations(best_match)
            }
            
        except Exception as e:
            print(f"Style detection error: {e}")
            raise
    
    def _extract_style_features(self, audio_features: Dict) -> StyleFeatures:
        """Extract style-relevant features from audio analysis"""
        # This would analyze the actual audio features
        # For now, return placeholder
        return StyleFeatures(
            speed_bpm=audio_features.get('tempo', 120),
            note_density=audio_features.get('note_density', 0.5),
            vibrato_rate=audio_features.get('vibrato_rate', 4.0),
            bend_frequency=audio_features.get('bend_frequency', 0.3),
            palm_mute_ratio=audio_features.get('palm_mute_ratio', 0.3),
            legato_ratio=audio_features.get('legato_ratio', 0.3),
            scale_patterns=audio_features.get('scale_patterns', []),
            common_intervals=audio_features.get('intervals', []),
            rhythm_complexity=audio_features.get('rhythm_complexity', 0.5),
            harmonic_complexity=audio_features.get('harmonic_complexity', 0.5)
        )
    
    def _calculate_similarity(
        self,
        features1: StyleFeatures,
        features2: StyleFeatures
    ) -> float:
        """Calculate similarity between two style profiles"""
        # Weighted similarity calculation
        weights = {
            'speed': 0.15,
            'note_density': 0.15,
            'vibrato': 0.10,
            'bending': 0.10,
            'palm_mute': 0.10,
            'legato': 0.10,
            'scales': 0.15,
            'intervals': 0.10,
            'rhythm': 0.05
        }
        
        similarities = {
            'speed': 1.0 - abs(features1.speed_bpm - features2.speed_bpm) / 200,
            'note_density': 1.0 - abs(features1.note_density - features2.note_density),
            'vibrato': 1.0 - abs(features1.vibrato_rate - features2.vibrato_rate) / 10,
            'bending': 1.0 - abs(features1.bend_frequency - features2.bend_frequency),
            'palm_mute': 1.0 - abs(features1.palm_mute_ratio - features2.palm_mute_ratio),
            'legato': 1.0 - abs(features1.legato_ratio - features2.legato_ratio),
            'scales': self._scale_similarity(features1.scale_patterns, features2.scale_patterns),
            'intervals': self._interval_similarity(features1.common_intervals, features2.common_intervals),
            'rhythm': 1.0 - abs(features1.rhythm_complexity - features2.rhythm_complexity)
        }
        
        # Weighted average
        total_similarity = sum(
            similarities[key] * weights[key]
            for key in weights
        )
        
        return min(max(total_similarity, 0.0), 1.0)
    
    def _scale_similarity(self, scales1: List[str], scales2: List[str]) -> float:
        """Calculate similarity between scale usage"""
        if not scales1 or not scales2:
            return 0.0
        
        common = set(scales1).intersection(set(scales2))
        total = set(scales1).union(set(scales2))
        
        return len(common) / len(total) if total else 0.0
    
    def _interval_similarity(self, intervals1: List[int], intervals2: List[int]) -> float:
        """Calculate similarity between interval usage"""
        if not intervals1 or not intervals2:
            return 0.0
        
        # Compare interval distributions
        hist1 = np.histogram(intervals1, bins=12)[0]
        hist2 = np.histogram(intervals2, bins=12)[0]
        
        # Normalize
        hist1 = hist1 / (hist1.sum() + 1e-10)
        hist2 = hist2 / (hist2.sum() + 1e-10)
        
        # Calculate correlation
        return np.corrcoef(hist1, hist2)[0, 1]
    
    def _analyze_techniques(
        self,
        features: StyleFeatures,
        style: GuitaristStyle
    ) -> Dict:
        """Analyze specific techniques used"""
        techniques = []
        characteristics = []
        
        # Speed-based techniques
        if features.speed_bpm > 160:
            techniques.append("Fast alternate picking")
            if style == GuitaristStyle.YNGWIE_MALMSTEEN:
                techniques.append("Sweep picking")
        
        # Vibrato analysis
        if features.vibrato_rate > 5:
            characteristics.append("Wide, fast vibrato")
        elif features.vibrato_rate > 3:
            characteristics.append("Moderate vibrato")
        
        # Bending analysis
        if features.bend_frequency > 0.4:
            techniques.append("Frequent string bending")
            characteristics.append("Blues influence")
        
        # Palm muting
        if features.palm_mute_ratio > 0.5:
            techniques.append("Heavy palm muting")
            characteristics.append("Rhythm-focused")
        
        # Legato
        if features.legato_ratio > 0.6:
            techniques.append("Legato phrasing")
        
        return {
            'techniques': techniques,
            'characteristics': characteristics
        }
    
    def _get_practice_recommendations(self, style: str) -> List[str]:
        """Get practice recommendations for detected style"""
        recommendations = {
            GuitaristStyle.YNGWIE_MALMSTEEN.value: [
                "Practice harmonic minor scales in all positions",
                "Work on sweep picking arpeggios",
                "Study Bach violin pieces",
                "Focus on pedal point exercises"
            ],
            GuitaristStyle.RANDY_RHOADS.value: [
                "Study classical guitar pieces",
                "Practice natural and harmonic minor scales",
                "Work on combining classical and rock techniques",
                "Analyze modal progressions"
            ],
            GuitaristStyle.JAMES_HETFIELD.value: [
                "Develop downpicking endurance",
                "Practice palm muting techniques",
                "Study chromatic riffs",
                "Work on tight rhythm playing"
            ],
            GuitaristStyle.JOHN_PETRUCCI.value: [
                "Practice odd time signatures",
                "Study all modes and scales",
                "Work on technical exercises",
                "Analyze complex progressions"
            ],
            GuitaristStyle.ERIC_CLAPTON.value: [
                "Master pentatonic scales",
                "Practice string bending accuracy",
                "Study blues turnarounds",
                "Work on call-and-response phrasing"
            ]
        }
        
        return recommendations.get(style, ["Continue practicing fundamentals"])

    def __init__(self):
        """Initialize empty __init__.py file"""
        pass
