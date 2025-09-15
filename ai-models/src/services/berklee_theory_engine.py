"""
Berklee-Level Music Theory Engine
세계 최고 수준의 음악 이론 분석 시스템
30년 경력 버클리 교수 수준의 이론 엔진
"""

from typing import Dict, List, Tuple, Optional, Set, Any
from dataclasses import dataclass
from enum import Enum
import numpy as np
from collections import defaultdict
import music21 as m21

# ============================================
# THEORETICAL FOUNDATIONS
# ============================================

class ChordQuality(Enum):
    """전문가 수준 코드 품질 분류"""
    # Triads
    MAJOR = "M"
    MINOR = "m"
    DIMINISHED = "dim"
    AUGMENTED = "aug"
    SUS2 = "sus2"
    SUS4 = "sus4"
    
    # Seventh Chords
    MAJOR7 = "maj7"
    MINOR7 = "m7"
    DOMINANT7 = "7"
    MINOR7B5 = "m7b5"
    DIMINISHED7 = "dim7"
    AUGMENTED7 = "aug7"
    MINOR_MAJOR7 = "mMaj7"
    
    # Extended Chords
    NINTH = "9"
    MINOR9 = "m9"
    MAJOR9 = "maj9"
    DOMINANT9 = "9"
    ELEVENTH = "11"
    MINOR11 = "m11"
    MAJOR11 = "maj11"
    THIRTEENTH = "13"
    MINOR13 = "m13"
    MAJOR13 = "maj13"
    
    # Altered Chords
    DOMINANT7_SHARP5 = "7#5"
    DOMINANT7_FLAT5 = "7b5"
    DOMINANT7_SHARP9 = "7#9"
    DOMINANT7_FLAT9 = "7b9"
    DOMINANT7_SHARP11 = "7#11"
    DOMINANT7_FLAT13 = "7b13"
    ALT = "alt"
    
    # Polychords & Upper Structures
    POLYCHORD = "poly"
    QUARTAL = "quartal"
    QUINTAL = "quintal"
    CLUSTER = "cluster"


class HarmonicFunction(Enum):
    """화성 기능 분석"""
    TONIC = "T"
    SUBDOMINANT = "SD"
    DOMINANT = "D"
    
    # Secondary Functions
    SECONDARY_DOMINANT = "V/x"
    SECONDARY_SUBDOMINANT = "IV/x"
    SECONDARY_DIMINISHED = "vii°/x"
    
    # Modal Functions
    MODAL_TONIC = "t"
    MODAL_SUBDOMINANT = "sd"
    MODAL_DOMINANT = "d"
    
    # Special Functions
    NEAPOLITAN = "N"
    AUGMENTED_SIXTH = "Aug6"
    BORROWED = "borrowed"
    CHROMATIC_MEDIANT = "CM"
    
    # Jazz Functions
    TURNAROUND = "turn"
    SUBSTITUTION = "sub"
    PASSING = "pass"
    PEDAL = "pedal"


@dataclass
class ChordAnalysis:
    """전문가 수준 코드 분석 결과"""
    root: str
    quality: ChordQuality
    bass: str
    inversion: int
    voicing: List[str]
    extensions: List[int]
    alterations: List[str]
    function: HarmonicFunction
    roman_numeral: str
    figured_bass: str
    voice_leading_quality: float
    tension_resolution: Optional[str]
    substitution_options: List[str]
    scale_options: List[str]
    approach_notes: List[str]
    upper_structures: List[str]


@dataclass
class VoiceLeadingAnalysis:
    """성부 진행 분석"""
    soprano_motion: List[int]
    alto_motion: List[int]
    tenor_motion: List[int]
    bass_motion: List[int]
    
    parallel_fifths: List[Tuple[str, str]]
    parallel_octaves: List[Tuple[str, str]]
    hidden_parallels: List[Tuple[str, str]]
    
    voice_crossing: List[Tuple[str, str]]
    voice_overlap: List[Tuple[str, str]]
    
    smoothness_score: float
    contrary_motion_percentage: float
    oblique_motion_percentage: float
    similar_motion_percentage: float
    
    resolution_quality: Dict[str, float]
    tendency_tone_resolutions: Dict[str, bool]


# ============================================
# BERKLEE HARMONY ENGINE
# ============================================

class BerkleeHarmonyEngine:
    """버클리 수준의 화성 분석 엔진"""
    
    def __init__(self):
        self.chord_database = self._initialize_chord_database()
        self.scale_database = self._initialize_scale_database()
        self.progression_patterns = self._load_progression_patterns()
        self.voice_leading_rules = self._initialize_voice_leading_rules()
        self.style_idioms = self._load_style_idioms()
        
    def _initialize_chord_database(self) -> Dict:
        """완전한 코드 데이터베이스 구축"""
        return {
            # Basic Triads
            'major': [0, 4, 7],
            'minor': [0, 3, 7],
            'diminished': [0, 3, 6],
            'augmented': [0, 4, 8],
            
            # Seventh Chords
            'maj7': [0, 4, 7, 11],
            'm7': [0, 3, 7, 10],
            '7': [0, 4, 7, 10],
            'm7b5': [0, 3, 6, 10],
            'dim7': [0, 3, 6, 9],
            'aug7': [0, 4, 8, 10],
            'mMaj7': [0, 3, 7, 11],
            
            # Extended Chords (9, 11, 13)
            'maj9': [0, 4, 7, 11, 14],
            'm9': [0, 3, 7, 10, 14],
            '9': [0, 4, 7, 10, 14],
            'maj11': [0, 4, 7, 11, 14, 17],
            'm11': [0, 3, 7, 10, 14, 17],
            '11': [0, 4, 7, 10, 14, 17],
            'maj13': [0, 4, 7, 11, 14, 17, 21],
            'm13': [0, 3, 7, 10, 14, 17, 21],
            '13': [0, 4, 7, 10, 14, 17, 21],
            
            # Altered Dominants
            '7alt': [0, 4, 6, 10],  # 7b5
            '7#5': [0, 4, 8, 10],
            '7b9': [0, 4, 7, 10, 13],
            '7#9': [0, 4, 7, 10, 15],
            '7#11': [0, 4, 7, 10, 14, 18],
            '7b13': [0, 4, 7, 10, 14, 17, 20],
            
            # Suspended Chords
            'sus2': [0, 2, 7],
            'sus4': [0, 5, 7],
            '7sus4': [0, 5, 7, 10],
            
            # Add Chords
            'add9': [0, 4, 7, 14],
            'madd9': [0, 3, 7, 14],
            'add11': [0, 4, 7, 17],
            'add13': [0, 4, 7, 21],
            
            # Quartal Voicings
            'quartal': [0, 5, 10, 15],
            'quintal': [0, 7, 14, 21],
            
            # Upper Structure Triads
            'UST_II': [2, 6, 9],     # II triad over root
            'UST_bIII': [3, 7, 10],   # bIII triad
            'UST_III': [4, 8, 11],    # III triad
            'UST_#IV': [6, 10, 13],   # #IV triad
            'UST_bVI': [8, 12, 15],   # bVI triad
            'UST_VI': [9, 13, 16]     # VI triad
        }
    
    def _initialize_scale_database(self) -> Dict:
        """완전한 스케일/모드 데이터베이스"""
        return {
            # Traditional Modes
            'ionian': [0, 2, 4, 5, 7, 9, 11],
            'dorian': [0, 2, 3, 5, 7, 9, 10],
            'phrygian': [0, 1, 3, 5, 7, 8, 10],
            'lydian': [0, 2, 4, 6, 7, 9, 11],
            'mixolydian': [0, 2, 4, 5, 7, 9, 10],
            'aeolian': [0, 2, 3, 5, 7, 8, 10],
            'locrian': [0, 1, 3, 5, 6, 8, 10],
            
            # Harmonic Minor Modes
            'harmonic_minor': [0, 2, 3, 5, 7, 8, 11],
            'locrian_nat6': [0, 1, 3, 5, 6, 9, 10],
            'ionian_sharp5': [0, 2, 4, 5, 8, 9, 11],
            'dorian_sharp4': [0, 2, 3, 6, 7, 9, 10],
            'phrygian_dominant': [0, 1, 4, 5, 7, 8, 10],
            'lydian_sharp2': [0, 3, 4, 6, 7, 9, 11],
            'ultralocrian': [0, 1, 3, 4, 6, 8, 9],
            
            # Melodic Minor Modes
            'melodic_minor': [0, 2, 3, 5, 7, 9, 11],
            'dorian_b2': [0, 1, 3, 5, 7, 9, 10],
            'lydian_augmented': [0, 2, 4, 6, 8, 9, 11],
            'lydian_dominant': [0, 2, 4, 6, 7, 9, 10],
            'mixolydian_b6': [0, 2, 4, 5, 7, 8, 10],
            'locrian_nat2': [0, 2, 3, 5, 6, 8, 10],
            'altered': [0, 1, 3, 4, 6, 8, 10],
            
            # Pentatonic Scales
            'major_pentatonic': [0, 2, 4, 7, 9],
            'minor_pentatonic': [0, 3, 5, 7, 10],
            'blues': [0, 3, 5, 6, 7, 10],
            
            # Bebop Scales
            'bebop_dominant': [0, 2, 4, 5, 7, 9, 10, 11],
            'bebop_major': [0, 2, 4, 5, 7, 8, 9, 11],
            'bebop_minor': [0, 2, 3, 5, 7, 8, 9, 10],
            
            # Symmetric Scales
            'whole_tone': [0, 2, 4, 6, 8, 10],
            'diminished_whole_half': [0, 2, 3, 5, 6, 8, 9, 11],
            'diminished_half_whole': [0, 1, 3, 4, 6, 7, 9, 10],
            'augmented': [0, 3, 4, 7, 8, 11],
            
            # Exotic Scales
            'hungarian_minor': [0, 2, 3, 6, 7, 8, 11],
            'persian': [0, 1, 4, 5, 6, 8, 11],
            'japanese': [0, 1, 5, 7, 8],
            'egyptian': [0, 2, 5, 7, 10],
            'spanish': [0, 1, 4, 5, 7, 8, 10]
        }
    
    def analyze_chord(self, notes: List[str], key: str = 'C') -> ChordAnalysis:
        """전문가 수준의 코드 분석"""
        
        # 음정 관계 분석
        intervals = self._calculate_intervals(notes)
        
        # 코드 품질 판별
        quality = self._identify_chord_quality(intervals)
        
        # 전위 분석
        inversion = self._determine_inversion(notes)
        
        # 보이싱 분석
        voicing = self._analyze_voicing(notes)
        
        # 기능 화성 분석
        function = self._analyze_harmonic_function(notes, key)
        
        # 로마 숫자 분석
        roman = self._to_roman_numeral(notes[0], quality, key)
        
        # 성부 진행 품질
        voice_leading_quality = self._evaluate_voice_leading(notes)
        
        # 대체 코드 옵션
        substitutions = self._find_substitutions(notes, quality)
        
        # 사용 가능한 스케일
        scales = self._get_chord_scales(quality, function)
        
        # Upper Structure Triads
        upper_structures = self._find_upper_structures(notes)
        
        return ChordAnalysis(
            root=notes[0],
            quality=quality,
            bass=notes[-1],
            inversion=inversion,
            voicing=voicing,
            extensions=self._get_extensions(intervals),
            alterations=self._get_alterations(intervals),
            function=function,
            roman_numeral=roman,
            figured_bass=self._get_figured_bass(inversion, quality),
            voice_leading_quality=voice_leading_quality,
            tension_resolution=self._analyze_tension_resolution(notes),
            substitution_options=substitutions,
            scale_options=scales,
            approach_notes=self._find_approach_notes(notes),
            upper_structures=upper_structures
        )
    
    def analyze_progression(self, chords: List[List[str]], key: str = 'C') -> Dict:
        """코드 진행 분석"""
        
        progression_analysis = {
            'chords': [],
            'roman_numerals': [],
            'functions': [],
            'cadences': [],
            'modulations': [],
            'borrowed_chords': [],
            'secondary_dominants': [],
            'voice_leading': None,
            'style_classification': '',
            'complexity_score': 0.0
        }
        
        # 각 코드 분석
        for chord in chords:
            analysis = self.analyze_chord(chord, key)
            progression_analysis['chords'].append(analysis)
            progression_analysis['roman_numerals'].append(analysis.roman_numeral)
            progression_analysis['functions'].append(analysis.function)
        
        # 종지 감지
        progression_analysis['cadences'] = self._detect_cadences(progression_analysis['chords'])
        
        # 전조 감지
        progression_analysis['modulations'] = self._detect_modulations(chords)
        
        # 차용 화음 감지
        progression_analysis['borrowed_chords'] = self._detect_borrowed_chords(chords, key)
        
        # 부속 화음 감지
        progression_analysis['secondary_dominants'] = self._detect_secondary_functions(chords, key)
        
        # 성부 진행 분석
        progression_analysis['voice_leading'] = self._analyze_voice_leading_progression(chords)
        
        # 스타일 분류
        progression_analysis['style_classification'] = self._classify_progression_style(progression_analysis)
        
        # 복잡도 평가
        progression_analysis['complexity_score'] = self._calculate_complexity_score(progression_analysis)
        
        return progression_analysis
    
    def _detect_cadences(self, chord_analyses: List[ChordAnalysis]) -> List[Dict]:
        """종지 감지"""
        cadences = []
        
        for i in range(len(chord_analyses) - 1):
            curr = chord_analyses[i]
            next = chord_analyses[i + 1]
            
            # Perfect Authentic Cadence (V-I)
            if curr.function == HarmonicFunction.DOMINANT and next.function == HarmonicFunction.TONIC:
                if curr.quality in [ChordQuality.DOMINANT7, ChordQuality.MAJOR] and next.inversion == 0:
                    cadences.append({
                        'type': 'Perfect Authentic',
                        'position': i,
                        'strength': 1.0
                    })
            
            # Imperfect Authentic Cadence
            elif curr.function == HarmonicFunction.DOMINANT and next.function == HarmonicFunction.TONIC:
                if next.inversion != 0:
                    cadences.append({
                        'type': 'Imperfect Authentic',
                        'position': i,
                        'strength': 0.7
                    })
            
            # Plagal Cadence (IV-I)
            elif curr.function == HarmonicFunction.SUBDOMINANT and next.function == HarmonicFunction.TONIC:
                cadences.append({
                    'type': 'Plagal',
                    'position': i,
                    'strength': 0.6
                })
            
            # Half Cadence (X-V)
            elif next.function == HarmonicFunction.DOMINANT:
                cadences.append({
                    'type': 'Half',
                    'position': i,
                    'strength': 0.5
                })
            
            # Deceptive Cadence (V-vi)
            elif curr.function == HarmonicFunction.DOMINANT and 'vi' in next.roman_numeral:
                cadences.append({
                    'type': 'Deceptive',
                    'position': i,
                    'strength': 0.6
                })
        
        return cadences
    
    def generate_chord_progression(self, 
                                  style: str,
                                  length: int = 8,
                                  key: str = 'C',
                                  complexity: float = 0.5) -> List[str]:
        """스타일별 코드 진행 생성"""
        
        progressions = {
            'jazz': self._generate_jazz_progression,
            'classical': self._generate_classical_progression,
            'pop': self._generate_pop_progression,
            'blues': self._generate_blues_progression,
            'modal': self._generate_modal_progression
        }
        
        generator = progressions.get(style, self._generate_generic_progression)
        return generator(length, key, complexity)
    
    def _generate_jazz_progression(self, length: int, key: str, complexity: float) -> List[str]:
        """재즈 진행 생성"""
        progression = []
        
        # Basic ii-V-I 
        if complexity < 0.3:
            pattern = ['IIm7', 'V7', 'Imaj7', 'VIm7']
        # With substitutions
        elif complexity < 0.7:
            pattern = ['IIm7', 'bII7', 'Imaj7', 'VI7alt', 'IIm7', 'V7', 'IIIm7', 'VI7']
        # Advanced with Coltrane changes
        else:
            pattern = ['Imaj7', 'V7/IV', 'IVmaj7', 'bVII7', 'IIIm7', 'VI7', 'IIm7', 'V7']
        
        # Extend pattern to desired length
        while len(progression) < length:
            progression.extend(pattern)
        
        return progression[:length]
    
    def voice_leading_analysis(self, chord_progression: List[List[str]]) -> VoiceLeadingAnalysis:
        """전문가급 성부 진행 분석"""
        
        # 성부 추적
        voices = self._track_voices(chord_progression)
        
        # 평행 5도/8도 검사
        parallels = self._check_parallel_motion(voices)
        
        # 은복 평행 검사
        hidden = self._check_hidden_parallels(voices)
        
        # 성부 교차/중복 검사
        crossings = self._check_voice_crossing(voices)
        overlaps = self._check_voice_overlap(voices)
        
        # 운동 유형 분석
        motion_types = self._analyze_motion_types(voices)
        
        # 해결 품질 평가
        resolution_quality = self._evaluate_resolutions(chord_progression)
        
        # 경향음 해결 검사
        tendency_resolutions = self._check_tendency_tones(chord_progression)
        
        # 부드러움 점수 계산
        smoothness = self._calculate_smoothness_score(voices)
        
        return VoiceLeadingAnalysis(
            soprano_motion=voices['soprano'],
            alto_motion=voices['alto'],
            tenor_motion=voices['tenor'],
            bass_motion=voices['bass'],
            parallel_fifths=parallels['fifths'],
            parallel_octaves=parallels['octaves'],
            hidden_parallels=hidden,
            voice_crossing=crossings,
            voice_overlap=overlaps,
            smoothness_score=smoothness,
            contrary_motion_percentage=motion_types['contrary'],
            oblique_motion_percentage=motion_types['oblique'],
            similar_motion_percentage=motion_types['similar'],
            resolution_quality=resolution_quality,
            tendency_tone_resolutions=tendency_resolutions
        )


# ============================================
# ADVANCED JAZZ THEORY
# ============================================

class JazzTheoryEngine:
    """재즈 이론 전문 엔진"""
    
    def __init__(self):
        self.bebop_vocabulary = self._load_bebop_vocabulary()
        self.substitution_rules = self._initialize_substitution_rules()
        self.reharmonization_techniques = self._load_reharmonization_techniques()
        
    def analyze_jazz_harmony(self, progression: List[str]) -> Dict:
        """재즈 화성 전문 분석"""
        
        analysis = {
            'ii_v_i_chains': self._find_ii_v_i_progressions(progression),
            'turnarounds': self._identify_turnarounds(progression),
            'modal_interchanges': self._detect_modal_interchange(progression),
            'tritone_substitutions': self._find_tritone_subs(progression),
            'diminished_passing': self._find_diminished_passing_chords(progression),
            'chromatic_approach': self._analyze_chromatic_approach(progression),
            'coltrane_changes': self._detect_coltrane_matrix(progression),
            'bebop_elements': self._analyze_bebop_elements(progression),
            'quartal_voicings': self._identify_quartal_harmony(progression),
            'upper_structures': self._analyze_upper_structures(progression)
        }
        
        return analysis
    
    def generate_bebop_line(self, 
                           chord_changes: List[str],
                           style: str = 'parker') -> List[Dict]:
        """비밥 라인 생성"""
        
        styles = {
            'parker': self._parker_style_line,
            'powell': self._powell_style_line,
            'gillespie': self._gillespie_style_line,
            'evans': self._evans_style_line
        }
        
        generator = styles.get(style, self._generic_bebop_line)
        return generator(chord_changes)
    
    def reharmonize(self, 
                    original_progression: List[str],
                    technique: str = 'tritone') -> List[str]:
        """리하모니제이션"""
        
        techniques = {
            'tritone': self._tritone_substitution,
            'chromatic': self._chromatic_reharmonization,
            'modal': self._modal_reharmonization,
            'coltrane': self._coltrane_reharmonization,
            'diminished': self._diminished_reharmonization,
            'pedal': self._pedal_point_reharmonization
        }
        
        reharmonizer = techniques.get(technique, self._basic_reharmonization)
        return reharmonizer(original_progression)


# ============================================
# IMPROVISATION ENGINE
# ============================================

class ImprovisationEngine:
    """즉흥연주 교육 엔진"""
    
    def __init__(self):
        self.lick_database = self._load_lick_database()
        self.scale_patterns = self._initialize_scale_patterns()
        self.rhythmic_patterns = self._load_rhythmic_patterns()
        
    def generate_solo_framework(self,
                               chord_changes: List[str],
                               bars: int,
                               style: str) -> Dict:
        """솔로 프레임워크 생성"""
        
        framework = {
            'outline': [],
            'scale_choices': [],
            'target_notes': [],
            'approach_patterns': [],
            'rhythmic_suggestions': [],
            'dynamic_arc': [],
            'motivic_development': []
        }
        
        for i, chord in enumerate(chord_changes):
            bar_framework = {
                'chord': chord,
                'strong_beats': self._get_chord_tones(chord),
                'weak_beats': self._get_passing_tones(chord),
                'scale_options': self._get_scale_options(chord, style),
                'approach_notes': self._calculate_approach_notes(chord, chord_changes[i+1] if i+1 < len(chord_changes) else chord),
                'rhythmic_pattern': self._suggest_rhythmic_pattern(i, bars),
                'dynamic': self._suggest_dynamic(i, bars),
                'motivic_idea': self._develop_motif(i)
            }
            
            framework['outline'].append(bar_framework)
        
        return framework
    
    def analyze_improvisation(self, 
                            played_notes: List[Dict],
                            chord_context: List[str]) -> Dict:
        """즉흥연주 분석 및 피드백"""
        
        analysis = {
            'harmonic_accuracy': self._analyze_harmonic_accuracy(played_notes, chord_context),
            'rhythmic_sophistication': self._analyze_rhythmic_complexity(played_notes),
            'melodic_contour': self._analyze_melodic_shape(played_notes),
            'motivic_development': self._track_motivic_development(played_notes),
            'tension_resolution': self._analyze_tension_usage(played_notes, chord_context),
            'style_authenticity': self._measure_style_authenticity(played_notes),
            'creativity_score': self._calculate_creativity_score(played_notes),
            
            'strengths': [],
            'areas_for_improvement': [],
            'practice_suggestions': [],
            'similar_masters': []  # 비슷한 스타일의 마스터 연주자
        }
        
        # 강점 식별
        if analysis['harmonic_accuracy'] > 0.85:
            analysis['strengths'].append("Excellent harmonic awareness")
        if analysis['rhythmic_sophistication'] > 0.8:
            analysis['strengths'].append("Strong rhythmic vocabulary")
        if analysis['motivic_development'] > 0.75:
            analysis['strengths'].append("Good motivic development")
        
        # 개선 영역
        if analysis['harmonic_accuracy'] < 0.6:
            analysis['areas_for_improvement'].append("Work on chord-scale relationships")
            analysis['practice_suggestions'].append("Practice arpeggios slowly through changes")
        
        if analysis['tension_resolution'] < 0.5:
            analysis['areas_for_improvement'].append("Improve tension resolution")
            analysis['practice_suggestions'].append("Practice approach note exercises")
        
        # 유사한 마스터 찾기
        analysis['similar_masters'] = self._find_similar_playing_style(played_notes)
        
        return analysis


# ============================================
# EXPORT MAIN ENGINE
# ============================================

class CompleteMusicTheoryEngine:
    """통합 음악 이론 엔진 - 버클리 수준"""
    
    def __init__(self):
        self.harmony = BerkleeHarmonyEngine()
        self.jazz = JazzTheoryEngine()
        self.improvisation = ImprovisationEngine()
        
        # Additional specialized engines
        self.counterpoint = self._initialize_counterpoint_engine()
        self.arrangement = self._initialize_arrangement_engine()
        self.composition = self._initialize_composition_engine()
        
    def comprehensive_analysis(self, music_data: Dict) -> Dict:
        """종합적인 음악 분석"""
        
        return {
            'harmonic_analysis': self.harmony.analyze_progression(
                music_data.get('chords', []),
                music_data.get('key', 'C')
            ),
            'jazz_analysis': self.jazz.analyze_jazz_harmony(
                music_data.get('chords', [])
            ) if music_data.get('style') == 'jazz' else None,
            'voice_leading': self.harmony.voice_leading_analysis(
                music_data.get('chords', [])
            ),
            'form_analysis': self._analyze_musical_form(music_data),
            'motivic_analysis': self._analyze_motifs(music_data),
            'orchestration_suggestions': self._suggest_orchestration(music_data),
            'performance_notes': self._generate_performance_notes(music_data)
        }
    
    def generate_exercise(self, 
                         skill_level: str,
                         focus_area: str,
                         duration_bars: int = 8) -> Dict:
        """맞춤형 연습 생성"""
        
        exercises = {
            'harmony': {
                'beginner': lambda: self._generate_basic_harmony_exercise(duration_bars),
                'intermediate': lambda: self._generate_intermediate_harmony_exercise(duration_bars),
                'advanced': lambda: self._generate_advanced_harmony_exercise(duration_bars)
            },
            'improvisation': {
                'beginner': lambda: self._generate_basic_improv_exercise(duration_bars),
                'intermediate': lambda: self._generate_intermediate_improv_exercise(duration_bars),
                'advanced': lambda: self._generate_advanced_improv_exercise(duration_bars)
            },
            'voice_leading': {
                'beginner': lambda: self._generate_basic_voice_leading_exercise(duration_bars),
                'intermediate': lambda: self._generate_intermediate_voice_leading_exercise(duration_bars),
                'advanced': lambda: self._generate_advanced_voice_leading_exercise(duration_bars)
            }
        }
        
        return exercises[focus_area][skill_level]()
    
    def evaluate_performance(self, 
                            student_performance: Dict,
                            reference: Optional[Dict] = None) -> Dict:
        """연주 평가 및 피드백"""
        
        evaluation = {
            'technical_accuracy': 0.0,
            'harmonic_understanding': 0.0,
            'rhythmic_precision': 0.0,
            'musical_expression': 0.0,
            'creativity': 0.0,
            'overall_score': 0.0,
            
            'detailed_feedback': {},
            'personalized_exercises': [],
            'next_steps': [],
            'achievement_badges': []
        }
        
        # 기술적 정확도 평가
        evaluation['technical_accuracy'] = self._evaluate_technical_accuracy(student_performance)
        
        # 화성 이해도 평가
        evaluation['harmonic_understanding'] = self._evaluate_harmonic_understanding(student_performance)
        
        # 리듬 정확도 평가
        evaluation['rhythmic_precision'] = self._evaluate_rhythmic_precision(student_performance)
        
        # 음악적 표현 평가
        evaluation['musical_expression'] = self._evaluate_expression(student_performance)
        
        # 창의성 평가
        evaluation['creativity'] = self._evaluate_creativity(student_performance)
        
        # 종합 점수
        evaluation['overall_score'] = np.mean([
            evaluation['technical_accuracy'],
            evaluation['harmonic_understanding'],
            evaluation['rhythmic_precision'],
            evaluation['musical_expression'],
            evaluation['creativity']
        ])
        
        # 상세 피드백 생성
        evaluation['detailed_feedback'] = self._generate_detailed_feedback(evaluation)
        
        # 맞춤형 연습 추천
        evaluation['personalized_exercises'] = self._recommend_exercises(evaluation)
        
        # 다음 학습 단계
        evaluation['next_steps'] = self._suggest_next_steps(evaluation)
        
        # 성취 배지
        evaluation['achievement_badges'] = self._award_badges(evaluation)
        
        return evaluation


# 사용 예시
if __name__ == "__main__":
    # 엔진 초기화
    engine = CompleteMusicTheoryEngine()
    
    # 코드 진행 분석
    progression = [
        ['D', 'F#', 'A', 'C#'],  # Dmaj7
        ['G', 'B', 'D', 'F'],     # G7
        ['C', 'E', 'G', 'B'],     # Cmaj7
        ['C', 'E', 'G', 'Bb']     # C7
    ]
    
    analysis = engine.harmony.analyze_progression(progression, key='C')
    print(f"Progression Analysis:")
    print(f"  Roman Numerals: {analysis['roman_numerals']}")
    print(f"  Functions: {[str(f) for f in analysis['functions']]}")
    print(f"  Cadences: {analysis['cadences']}")
    print(f"  Style: {analysis['style_classification']}")
    print(f"  Complexity: {analysis['complexity_score']:.2f}")
    
    # 재즈 리하모니제이션
    original = ['Cmaj7', 'Am7', 'Dm7', 'G7']
    reharmonized = engine.jazz.reharmonize(original, technique='tritone')
    print(f"\nReharmonization:")
    print(f"  Original: {original}")
    print(f"  Reharmonized: {reharmonized}")
    
    # 솔로 프레임워크 생성
    solo_framework = engine.improvisation.generate_solo_framework(
        chord_changes=['Cmaj7', 'A7', 'Dm7', 'G7'],
        bars=4,
        style='bebop'
    )
    print(f"\nSolo Framework:")
    for bar in solo_framework['outline']:
        print(f"  {bar['chord']}: {bar['scale_options']}")