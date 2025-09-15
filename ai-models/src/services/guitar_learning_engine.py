"""
Guitar Learning Engine
기타 특화 학습 엔진 - 세계 최고 수준의 기타 교육 시스템
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import numpy as np
import json


class GuitarTechnique(Enum):
    """기타 테크닉 분류"""
    # Picking Techniques
    ALTERNATE_PICKING = "alternate_picking"
    ECONOMY_PICKING = "economy_picking"
    SWEEP_PICKING = "sweep_picking"
    HYBRID_PICKING = "hybrid_picking"
    FINGERPICKING = "fingerpicking"
    
    # Fretting Techniques
    HAMMER_ON = "hammer_on"
    PULL_OFF = "pull_off"
    SLIDE = "slide"
    BEND = "bend"
    VIBRATO = "vibrato"
    TAPPING = "tapping"
    
    # Advanced Techniques
    LEGATO = "legato"
    STRING_SKIPPING = "string_skipping"
    TREMOLO_PICKING = "tremolo_picking"
    HARMONICS = "harmonics"
    PALM_MUTING = "palm_muting"
    RAKE = "rake"


class FretboardPosition(Enum):
    """프렛보드 포지션"""
    OPEN = "open"  # 0-3 fret
    FIRST = "first"  # 1-5 fret
    FIFTH = "fifth"  # 5-9 fret
    SEVENTH = "seventh"  # 7-12 fret
    TWELFTH = "twelfth"  # 12-17 fret
    FIFTEENTH = "fifteenth"  # 15-19 fret


@dataclass
class GuitarExercise:
    """기타 연습 구조"""
    name: str
    technique: GuitarTechnique
    difficulty: int  # 1-10
    tempo_bpm: int
    duration_bars: int
    tab_notation: str
    fingering: List[int]
    position: FretboardPosition
    tips: List[str]


@dataclass 
class Fingering:
    """운지법 데이터"""
    fret: int
    string: int
    finger: int  # 1=index, 2=middle, 3=ring, 4=pinky, 0=open
    position: FretboardPosition


class GuitarLearningEngine:
    """기타 학습 엔진"""
    
    def __init__(self):
        self.techniques_db = self._load_techniques_database()
        self.fretboard = self._initialize_fretboard()
        self.exercises_bank = self._load_exercise_bank()
        self.legendary_licks = self._load_legendary_licks()
        
    def _load_techniques_database(self) -> Dict:
        """기타 테크닉 데이터베이스"""
        return {
            GuitarTechnique.ALTERNATE_PICKING: {
                "description": "상하 교대로 피킹하는 기본 테크닉",
                "masters": ["Paul Gilbert", "John Petrucci", "Al Di Meola"],
                "exercises": [
                    "Chromatic patterns",
                    "String crossing",
                    "Inside/Outside picking",
                    "Paul Gilbert patterns"
                ],
                "common_mistakes": [
                    "Excessive tension",
                    "Anchoring too hard",
                    "Inefficient motion"
                ]
            },
            GuitarTechnique.SWEEP_PICKING: {
                "description": "연속된 스트링을 한 방향으로 스윕하며 연주",
                "masters": ["Yngwie Malmsteen", "Jason Becker", "Frank Gambale"],
                "exercises": [
                    "3-string arpeggios",
                    "5-string patterns",
                    "Economy picking transitions",
                    "Neo-classical sequences"
                ],
                "common_mistakes": [
                    "Rushing the sweep",
                    "Not muting properly",
                    "Uneven note duration"
                ]
            },
            GuitarTechnique.LEGATO: {
                "description": "해머온과 풀오프를 사용한 부드러운 연주",
                "masters": ["Joe Satriani", "Steve Vai", "Allan Holdsworth"],
                "exercises": [
                    "Hammer-on drills",
                    "Pull-off strength",
                    "Three-note-per-string",
                    "Legato runs"
                ],
                "common_mistakes": [
                    "Weak hammer-ons",
                    "Uneven volume",
                    "Lack of clarity"
                ]
            },
            GuitarTechnique.TAPPING: {
                "description": "오른손으로 프렛보드를 탭하여 연주",
                "masters": ["Eddie Van Halen", "Steve Vai", "Stanley Jordan"],
                "exercises": [
                    "Single finger tapping",
                    "Two-hand tapping",
                    "8-finger tapping",
                    "Tapped arpeggios"
                ],
                "common_mistakes": [
                    "Weak tap volume",
                    "Poor muting",
                    "Timing issues"
                ]
            }
        }
    
    def _initialize_fretboard(self) -> Dict:
        """프렛보드 노트 맵 초기화"""
        standard_tuning = ['E', 'A', 'D', 'G', 'B', 'E']
        chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        fretboard = {}
        for string_num, open_note in enumerate(standard_tuning, 1):
            string_notes = []
            start_index = chromatic.index(open_note)
            
            for fret in range(25):  # 0-24 frets
                note_index = (start_index + fret) % 12
                string_notes.append(chromatic[note_index])
            
            fretboard[string_num] = string_notes
            
        return fretboard
    
    def _load_exercise_bank(self) -> List[GuitarExercise]:
        """연습 문제 은행"""
        exercises = [
            GuitarExercise(
                name="Chromatic Warm-up",
                technique=GuitarTechnique.ALTERNATE_PICKING,
                difficulty=2,
                tempo_bpm=80,
                duration_bars=4,
                tab_notation="e|--1-2-3-4-5-4-3-2--|\nB|--1-2-3-4-5-4-3-2--|",
                fingering=[1, 2, 3, 4],
                position=FretboardPosition.FIRST,
                tips=["Keep fingers close to frets", "Maintain steady tempo"]
            ),
            GuitarExercise(
                name="Minor Pentatonic Pattern 1",
                technique=GuitarTechnique.ALTERNATE_PICKING,
                difficulty=3,
                tempo_bpm=100,
                duration_bars=2,
                tab_notation="e|--------5-8--------|\nB|------5-8----------|\nG|----5-7------------|",
                fingering=[1, 4, 1, 3],
                position=FretboardPosition.FIFTH,
                tips=["Start with downstroke", "Keep pick angle consistent"]
            ),
            GuitarExercise(
                name="Sweep Arpeggio Am",
                technique=GuitarTechnique.SWEEP_PICKING,
                difficulty=7,
                tempo_bpm=120,
                duration_bars=1,
                tab_notation="e|--------12-17-------|\nB|-----13-------13----|\nG|--14-----------14---|",
                fingering=[1, 2, 4],
                position=FretboardPosition.TWELFTH,
                tips=["One continuous motion", "Roll fingers for clean notes"]
            ),
            GuitarExercise(
                name="Legato Exercise",
                technique=GuitarTechnique.LEGATO,
                difficulty=5,
                tempo_bpm=90,
                duration_bars=2,
                tab_notation="e|--5h7p5h8p5h7p5--|\nB|-----------------|",
                fingering=[1, 3, 1, 4, 1, 3, 1],
                position=FretboardPosition.FIFTH,
                tips=["Strong hammer-ons", "Light pull-offs", "Minimal picking"]
            )
        ]
        
        return exercises
    
    def _load_legendary_licks(self) -> Dict:
        """전설적인 기타리스트들의 시그니처 릭"""
        return {
            "Yngwie Malmsteen": {
                "name": "Harmonic Minor Run",
                "technique": [GuitarTechnique.SWEEP_PICKING, GuitarTechnique.ALTERNATE_PICKING],
                "difficulty": 9,
                "description": "Neo-classical harmonic minor scale run",
                "tab": "High E string: 12-13-16-13-12..."
            },
            "Paul Gilbert": {
                "name": "String Skipping Pattern",
                "technique": [GuitarTechnique.STRING_SKIPPING, GuitarTechnique.ALTERNATE_PICKING],
                "difficulty": 8,
                "description": "Wide interval string skipping",
                "tab": "Pattern across 1st and 3rd strings"
            },
            "Joe Satriani": {
                "name": "Melodic Legato Phrase",
                "technique": [GuitarTechnique.LEGATO, GuitarTechnique.BEND],
                "difficulty": 6,
                "description": "Singing legato melody",
                "tab": "Mixolydian mode with expressive bends"
            },
            "Steve Vai": {
                "name": "Harmonic Tapping",
                "technique": [GuitarTechnique.TAPPING, GuitarTechnique.HARMONICS],
                "difficulty": 9,
                "description": "Tapped harmonics sequence",
                "tab": "12th fret harmonics with tapping"
            }
        }
    
    def analyze_playing_style(self, audio_features: Dict) -> Dict:
        """연주 스타일 분석"""
        style_analysis = {
            "primary_technique": self._identify_primary_technique(audio_features),
            "tempo_preference": audio_features.get("avg_tempo", 120),
            "note_density": audio_features.get("notes_per_second", 4),
            "vibrato_characteristics": {
                "speed": audio_features.get("vibrato_speed", "medium"),
                "width": audio_features.get("vibrato_width", "narrow")
            },
            "picking_style": self._analyze_picking_style(audio_features),
            "genre_affinity": self._determine_genre(audio_features)
        }
        
        return style_analysis
    
    def _identify_primary_technique(self, features: Dict) -> GuitarTechnique:
        """주요 테크닉 식별"""
        # 실제로는 ML 모델 사용
        if features.get("legato_ratio", 0) > 0.7:
            return GuitarTechnique.LEGATO
        elif features.get("sweep_detected", False):
            return GuitarTechnique.SWEEP_PICKING
        else:
            return GuitarTechnique.ALTERNATE_PICKING
    
    def _analyze_picking_style(self, features: Dict) -> str:
        """피킹 스타일 분석"""
        attack = features.get("pick_attack", "medium")
        angle = features.get("pick_angle", "neutral")
        
        if attack == "heavy" and angle == "downward":
            return "Aggressive metal style"
        elif attack == "light" and angle == "neutral":
            return "Jazz/fusion style"
        else:
            return "Balanced rock style"
    
    def _determine_genre(self, features: Dict) -> List[str]:
        """장르 판별"""
        genres = []
        
        if features.get("distortion_level", 0) > 0.7:
            genres.append("Metal")
        if features.get("jazz_chords", False):
            genres.append("Jazz")
        if features.get("blues_scales", False):
            genres.append("Blues")
        if features.get("clean_tone", False):
            genres.append("Pop/Funk")
            
        return genres if genres else ["Rock"]
    
    def generate_fingering(self, notes: List[str], position_preference: Optional[FretboardPosition] = None) -> List[Fingering]:
        """최적 운지법 생성"""
        fingerings = []
        
        for note in notes:
            possible_positions = self._find_note_positions(note)
            
            if position_preference:
                # 선호 포지션에서 찾기
                preferred = [p for p in possible_positions if self._get_position(p[1]) == position_preference]
                if preferred:
                    possible_positions = preferred
            
            # 가장 효율적인 포지션 선택
            best_position = self._select_best_position(possible_positions, fingerings)
            
            fingering = Fingering(
                fret=best_position[1],
                string=best_position[0],
                finger=self._assign_finger(best_position[1], position_preference),
                position=self._get_position(best_position[1])
            )
            
            fingerings.append(fingering)
        
        return fingerings
    
    def _find_note_positions(self, note: str) -> List[Tuple[int, int]]:
        """노트의 모든 가능한 포지션 찾기"""
        positions = []
        
        for string_num, string_notes in self.fretboard.items():
            for fret, fret_note in enumerate(string_notes[:20]):  # 20프렛까지만
                if fret_note == note:
                    positions.append((string_num, fret))
        
        return positions
    
    def _get_position(self, fret: int) -> FretboardPosition:
        """프렛 번호로 포지션 결정"""
        if fret <= 3:
            return FretboardPosition.OPEN
        elif fret <= 5:
            return FretboardPosition.FIRST
        elif fret <= 9:
            return FretboardPosition.FIFTH
        elif fret <= 12:
            return FretboardPosition.SEVENTH
        elif fret <= 17:
            return FretboardPosition.TWELFTH
        else:
            return FretboardPosition.FIFTEENTH
    
    def _select_best_position(self, positions: List[Tuple[int, int]], previous: List[Fingering]) -> Tuple[int, int]:
        """가장 효율적인 포지션 선택"""
        if not previous:
            # 중간 포지션 선호 (5-7 프렛)
            return min(positions, key=lambda p: abs(p[1] - 6))
        
        last = previous[-1]
        # 이전 포지션과 가장 가까운 위치 선택
        return min(positions, key=lambda p: abs(p[1] - last.fret) + abs(p[0] - last.string))
    
    def _assign_finger(self, fret: int, position: Optional[FretboardPosition]) -> int:
        """프렛에 적절한 손가락 할당"""
        if fret == 0:
            return 0  # Open string
        
        if position == FretboardPosition.OPEN:
            return min(fret, 4)  # 1-4 fingers
        else:
            # 포지션 내에서 상대적 손가락 배치
            base_fret = {
                FretboardPosition.FIRST: 1,
                FretboardPosition.FIFTH: 5,
                FretboardPosition.SEVENTH: 7,
                FretboardPosition.TWELFTH: 12
            }.get(position, 5)
            
            relative = fret - base_fret + 1
            return max(1, min(relative, 4))
    
    def recommend_exercises(self, weakness: str, level: int) -> List[GuitarExercise]:
        """약점 기반 연습 추천"""
        relevant_exercises = []
        
        for exercise in self.exercises_bank:
            # 난이도가 적절한 범위인지 확인
            if level - 1 <= exercise.difficulty <= level + 1:
                # 약점과 관련된 테크닉인지 확인
                if weakness.lower() in exercise.technique.value:
                    relevant_exercises.append(exercise)
        
        return relevant_exercises[:3]  # 상위 3개 추천
    
    def create_custom_exercise(self, 
                              technique: GuitarTechnique,
                              difficulty: int,
                              focus_area: str) -> GuitarExercise:
        """맞춤형 연습 생성"""
        
        # 기본 템포 설정
        base_tempo = {
            1: 60, 2: 70, 3: 80, 4: 90, 5: 100,
            6: 110, 7: 120, 8: 130, 9: 140, 10: 150
        }.get(difficulty, 100)
        
        # 테크닉별 연습 패턴 생성
        if technique == GuitarTechnique.ALTERNATE_PICKING:
            tab = self._generate_picking_pattern(difficulty)
            tips = ["Focus on pick angle", "Minimize motion", "Stay relaxed"]
        elif technique == GuitarTechnique.LEGATO:
            tab = self._generate_legato_pattern(difficulty)
            tips = ["Strong hammer-ons", "Smooth pull-offs", "Minimal picking"]
        elif technique == GuitarTechnique.SWEEP_PICKING:
            tab = self._generate_sweep_pattern(difficulty)
            tips = ["Continuous motion", "Proper muting", "Even timing"]
        else:
            tab = "e|--5-7-8-7-5--|"
            tips = ["Practice slowly", "Focus on accuracy"]
        
        return GuitarExercise(
            name=f"Custom {technique.value} Exercise",
            technique=technique,
            difficulty=difficulty,
            tempo_bpm=base_tempo,
            duration_bars=4,
            tab_notation=tab,
            fingering=[1, 2, 3, 4],
            position=FretboardPosition.FIFTH,
            tips=tips
        )
    
    def _generate_picking_pattern(self, difficulty: int) -> str:
        """피킹 패턴 생성"""
        if difficulty <= 3:
            return "e|--5-7-8-7-5--|\nB|-------------|"
        elif difficulty <= 6:
            return "e|--5-7-8-10-8-7-5--|\nB|------------------|"
        else:
            return "e|--5-7-8-10-12-10-8-7-5--|\nB|------------------------|"
    
    def _generate_legato_pattern(self, difficulty: int) -> str:
        """레가토 패턴 생성"""
        if difficulty <= 3:
            return "e|--5h7p5--|\nB|---------|"
        elif difficulty <= 6:
            return "e|--5h7p5h8p5--|\nB|-------------|"
        else:
            return "e|--5h7p5h8p5h10p8p5--|\nB|--------------------|"
    
    def _generate_sweep_pattern(self, difficulty: int) -> str:
        """스윕 패턴 생성"""
        if difficulty <= 5:
            return "e|--------8--|\nB|-----5-----|\nG|--5--------|"
        else:
            return "e|-----------12--|\nB|--------9------|\nG|-----9---------|\nD|--10-----------|"
    
    def evaluate_performance(self, 
                            recorded_notes: List[Dict],
                            target_exercise: GuitarExercise) -> Dict:
        """연주 평가"""
        
        evaluation = {
            "overall_accuracy": 0.0,
            "timing_accuracy": 0.0,
            "technique_quality": 0.0,
            "specific_feedback": [],
            "improvement_areas": [],
            "score": 0
        }
        
        # 음정 정확도 계산
        pitch_accuracy = self._calculate_pitch_accuracy(recorded_notes, target_exercise)
        evaluation["overall_accuracy"] = pitch_accuracy
        
        # 타이밍 정확도 계산  
        timing_accuracy = self._calculate_timing_accuracy(recorded_notes, target_exercise.tempo_bpm)
        evaluation["timing_accuracy"] = timing_accuracy
        
        # 테크닉 품질 평가
        technique_score = self._evaluate_technique_quality(recorded_notes, target_exercise.technique)
        evaluation["technique_quality"] = technique_score
        
        # 종합 점수
        evaluation["score"] = int((pitch_accuracy + timing_accuracy + technique_score) / 3 * 100)
        
        # 구체적 피드백
        if pitch_accuracy < 0.8:
            evaluation["specific_feedback"].append("Focus on hitting the correct notes")
            evaluation["improvement_areas"].append("Pitch accuracy")
        
        if timing_accuracy < 0.8:
            evaluation["specific_feedback"].append("Work with a metronome at slower tempo")
            evaluation["improvement_areas"].append("Timing consistency")
        
        if technique_score < 0.7:
            evaluation["specific_feedback"].append(f"Practice {target_exercise.technique.value} isolation exercises")
            evaluation["improvement_areas"].append("Technique refinement")
        
        return evaluation
    
    def _calculate_pitch_accuracy(self, recorded: List[Dict], exercise: GuitarExercise) -> float:
        """음정 정확도 계산"""
        # 실제 구현에서는 오디오 분석 수행
        # 여기서는 시뮬레이션
        return np.random.uniform(0.7, 1.0)
    
    def _calculate_timing_accuracy(self, recorded: List[Dict], target_bpm: int) -> float:
        """타이밍 정확도 계산"""
        # 실제 구현에서는 onset detection 수행
        return np.random.uniform(0.6, 0.95)
    
    def _evaluate_technique_quality(self, recorded: List[Dict], technique: GuitarTechnique) -> float:
        """테크닉 품질 평가"""
        # 실제 구현에서는 테크닉별 특징 분석
        return np.random.uniform(0.65, 0.9)


# 사용 예시
if __name__ == "__main__":
    engine = GuitarLearningEngine()
    
    # 연주 스타일 분석
    audio_features = {
        "avg_tempo": 140,
        "notes_per_second": 8,
        "legato_ratio": 0.3,
        "distortion_level": 0.8,
        "vibrato_speed": "fast"
    }
    
    style = engine.analyze_playing_style(audio_features)
    print("Playing Style Analysis:")
    print(f"  Primary Technique: {style['primary_technique'].value}")
    print(f"  Genre Affinity: {style['genre_affinity']}")
    
    # 운지법 생성
    notes = ["E", "G", "A", "C", "D"]
    fingerings = engine.generate_fingering(notes, FretboardPosition.FIFTH)
    
    print("\nOptimal Fingering:")
    for note, fingering in zip(notes, fingerings):
        print(f"  {note}: String {fingering.string}, Fret {fingering.fret}, Finger {fingering.finger}")
    
    # 연습 추천
    exercises = engine.recommend_exercises("picking", level=5)
    
    print("\nRecommended Exercises:")
    for ex in exercises:
        print(f"  - {ex.name} (Difficulty: {ex.difficulty}/10)")
    
    # 맞춤 연습 생성
    custom = engine.create_custom_exercise(
        technique=GuitarTechnique.ALTERNATE_PICKING,
        difficulty=6,
        focus_area="speed"
    )
    
    print(f"\nCustom Exercise Created:")
    print(f"  {custom.name}")
    print(f"  Tempo: {custom.tempo_bpm} BPM")
    print(f"  Tips: {', '.join(custom.tips)}")