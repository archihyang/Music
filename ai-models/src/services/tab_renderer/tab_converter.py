"""
Tab Converter - Advanced MIDI to Guitar Tab Conversion Engine
Genesis Music - 전문가 수준의 기타 탭 변환 시스템

Features:
- Intelligent fingering optimization
- Multiple tuning support (Standard, Drop D, DADGAD, etc.)
- Advanced playing technique detection
- Position preference learning
- Chord shape recognition
- Capo position optimization
- Difficulty analysis
- Alternative fingering suggestions
"""

import numpy as np
from typing import List, Dict, Tuple, Optional, Set, Any, Union
from dataclasses import dataclass, field
from enum import Enum
import json
import logging
from collections import defaultdict
from itertools import combinations
import music21

logger = logging.getLogger(__name__)


class PlayingTechnique(Enum):
    """기타 연주 기법"""
    NORMAL = "normal"
    HAMMER_ON = "hammer_on"
    PULL_OFF = "pull_off"
    SLIDE_UP = "slide_up"
    SLIDE_DOWN = "slide_down"
    BEND = "bend"
    VIBRATO = "vibrato"
    PALM_MUTE = "palm_mute"
    HARMONIC = "harmonic"
    TAP = "tap"
    DEAD_NOTE = "dead_note"


class Tuning(Enum):
    """기타 튜닝 프리셋"""
    STANDARD = [40, 45, 50, 55, 59, 64]  # E A D G B E
    DROP_D = [38, 45, 50, 55, 59, 64]    # D A D G B E
    HALF_STEP_DOWN = [39, 44, 49, 54, 58, 63]  # Eb Ab Db Gb Bb Eb
    DROP_C = [36, 43, 48, 53, 57, 62]    # C G C F A D
    OPEN_G = [38, 43, 50, 55, 59, 62]    # D G D G B D
    DADGAD = [38, 45, 50, 55, 45, 62]    # D A D G A D
    OPEN_D = [38, 45, 50, 54, 57, 62]    # D A D F# A D
    BARITONE = [28, 33, 38, 43, 47, 52]  # B E A D F# B


@dataclass
class GuitarNote:
    """기타 노트 정보"""
    pitch: int  # MIDI pitch
    start_time: float
    end_time: float
    string: int  # 1-6
    fret: int    # 0-24+
    velocity: int
    techniques: List[PlayingTechnique] = field(default_factory=list)
    is_chord_tone: bool = False
    chord_shape: Optional[str] = None
    difficulty: float = 0.0


@dataclass
class TabMeasure:
    """탭 마디 정보"""
    number: int
    time_signature: Tuple[int, int]
    tempo: float
    notes: List[GuitarNote] = field(default_factory=list)
    chords: List[Dict] = field(default_factory=list)
    lyrics: Optional[str] = None


@dataclass
class TabConfiguration:
    """탭 변환 설정"""
    tuning: List[int] = field(default_factory=lambda: Tuning.STANDARD.value)
    capo_position: int = 0
    max_fret_span: int = 4  # Maximum fret span for one hand position
    prefer_open_strings: bool = True
    prefer_low_positions: bool = True
    max_position: int = 12  # Maximum fret position preference
    allow_impossible_stretches: bool = False
    detect_chords: bool = True
    optimize_fingering: bool = True
    include_techniques: bool = True
    difficulty_threshold: float = 0.7  # 0-1, filter out too difficult positions


class ChordShapeDetector:
    """코드 모양 감지기"""
    
    COMMON_SHAPES = {
        # Major chords
        "C": [(1, 0), (2, 1), (3, 0), (4, 2), (5, 3)],
        "G": [(1, 3), (2, 0), (3, 0), (4, 0), (5, 2), (6, 3)],
        "D": [(1, 2), (2, 3), (3, 2), (4, 0)],
        "A": [(1, 0), (2, 2), (3, 2), (4, 2), (5, 0)],
        "E": [(1, 0), (2, 0), (3, 1), (4, 2), (5, 2), (6, 0)],
        "F": [(1, 1), (2, 1), (3, 2), (4, 3), (5, 3), (6, 1)],
        
        # Minor chords
        "Am": [(1, 0), (2, 1), (3, 2), (4, 2), (5, 0)],
        "Em": [(1, 0), (2, 0), (3, 0), (4, 2), (5, 2), (6, 0)],
        "Dm": [(1, 1), (2, 3), (3, 2), (4, 0)],
        
        # 7th chords
        "G7": [(1, 1), (2, 0), (3, 0), (4, 0), (5, 2), (6, 3)],
        "C7": [(1, 0), (2, 1), (3, 3), (4, 2), (5, 3)],
        "D7": [(1, 2), (2, 1), (3, 2), (4, 0)],
    }
    
    def detect_chord_shape(self, notes: List[GuitarNote]) -> Optional[str]:
        """노트 그룹에서 코드 모양 감지"""
        if len(notes) < 3:
            return None
            
        positions = [(n.string, n.fret) for n in notes]
        
        # Check against known shapes
        for chord_name, shape in self.COMMON_SHAPES.items():
            if self._matches_shape(positions, shape):
                return chord_name
        
        return None
    
    def _matches_shape(self, positions: List[Tuple[int, int]], shape: List[Tuple[int, int]]) -> bool:
        """포지션이 코드 모양과 일치하는지 확인"""
        # Allow for barre chords (same shape moved up the neck)
        if len(positions) != len(shape):
            return False
            
        # Find the offset (for barre chords)
        min_fret_positions = min(p[1] for p in positions if p[1] > 0)
        min_fret_shape = min(s[1] for s in shape if s[1] > 0)
        offset = min_fret_positions - min_fret_shape
        
        # Check if all positions match with offset
        for pos in positions:
            string, fret = pos
            adjusted_shape = [(s, f + offset if f > 0 else 0) for s, f in shape]
            if pos not in adjusted_shape:
                return False
        
        return True


class TabConverter:
    """고급 MIDI to Tab 변환기"""
    
    def __init__(self, config: Optional[TabConfiguration] = None):
        self.config = config or TabConfiguration()
        self.chord_detector = ChordShapeDetector()
        self.position_cache = {}  # Cache for position calculations
        
    def convert_midi_to_tab(
        self,
        midi_notes: List[Dict],
        time_signature: Tuple[int, int] = (4, 4),
        tempo: float = 120.0,
        key_signature: Optional[str] = None
    ) -> List[TabMeasure]:
        """MIDI 노트를 기타 탭으로 변환"""
        
        # 1. Group notes into measures
        measures = self._group_into_measures(midi_notes, time_signature, tempo)
        
        # 2. Convert each measure
        tab_measures = []
        for measure_num, measure_notes in enumerate(measures):
            tab_measure = TabMeasure(
                number=measure_num + 1,
                time_signature=time_signature,
                tempo=tempo
            )
            
            # 3. Detect chords if enabled
            if self.config.detect_chords:
                chord_groups = self._detect_chord_groups(measure_notes)
                for group in chord_groups:
                    self._assign_chord_fingerings(group)
            
            # 4. Convert individual notes
            for note_data in measure_notes:
                guitar_notes = self._convert_note(note_data, tab_measure)
                tab_measure.notes.extend(guitar_notes)
            
            # 5. Optimize fingering if enabled
            if self.config.optimize_fingering:
                self._optimize_measure_fingering(tab_measure)
            
            # 6. Detect and add techniques
            if self.config.include_techniques:
                self._detect_techniques(tab_measure)
            
            tab_measures.append(tab_measure)
        
        return tab_measures
    
    def _convert_note(self, note_data: Dict, measure: TabMeasure) -> List[GuitarNote]:
        """단일 노트를 기타 포지션으로 변환"""
        pitch = note_data['pitch']
        
        # Apply capo adjustment
        adjusted_pitch = pitch - self.config.capo_position
        
        # Find all possible positions
        positions = self._find_positions(adjusted_pitch)
        
        # Filter by configuration
        positions = self._filter_positions(positions)
        
        if not positions:
            logger.warning(f"No valid position found for pitch {pitch}")
            return []
        
        # Select optimal position
        optimal_pos = self._select_optimal_position(
            positions,
            measure.notes,
            note_data
        )
        
        guitar_note = GuitarNote(
            pitch=pitch,
            start_time=note_data['start'],
            end_time=note_data['end'],
            string=optimal_pos['string'],
            fret=optimal_pos['fret'],
            velocity=note_data.get('velocity', 80),
            difficulty=optimal_pos['difficulty']
        )
        
        return [guitar_note]
    
    def _find_positions(self, pitch: int) -> List[Dict]:
        """주어진 피치에 대한 모든 가능한 포지션 찾기"""
        
        # Check cache
        if pitch in self.position_cache:
            return self.position_cache[pitch].copy()
        
        positions = []
        
        for string_idx, open_pitch in enumerate(self.config.tuning):
            fret = pitch - open_pitch
            
            if 0 <= fret <= 24:  # Standard guitar range
                difficulty = self._calculate_difficulty(string_idx + 1, fret)
                
                positions.append({
                    'string': string_idx + 1,
                    'fret': fret,
                    'difficulty': difficulty,
                    'is_open': fret == 0,
                    'position': self._get_hand_position(fret)
                })
        
        # Cache the result
        self.position_cache[pitch] = positions.copy()
        
        return positions
    
    def _filter_positions(self, positions: List[Dict]) -> List[Dict]:
        """설정에 따라 포지션 필터링"""
        filtered = []
        
        for pos in positions:
            # Skip positions beyond preference
            if pos['fret'] > self.config.max_position and not pos['is_open']:
                continue
            
            # Skip too difficult positions
            if pos['difficulty'] > self.config.difficulty_threshold:
                continue
            
            filtered.append(pos)
        
        return filtered
    
    def _select_optimal_position(
        self,
        positions: List[Dict],
        previous_notes: List[GuitarNote],
        note_data: Dict
    ) -> Dict:
        """최적의 포지션 선택"""
        
        if not positions:
            return None
        
        # If only one position, return it
        if len(positions) == 1:
            return positions[0]
        
        # Calculate scores for each position
        scored_positions = []
        
        for pos in positions:
            score = 0.0
            
            # Prefer open strings
            if self.config.prefer_open_strings and pos['is_open']:
                score += 2.0
            
            # Prefer low positions
            if self.config.prefer_low_positions:
                score += (12 - pos['fret']) / 12.0
            
            # Minimize position changes
            if previous_notes:
                last_note = previous_notes[-1]
                position_change = abs(pos['position'] - self._get_hand_position(last_note.fret))
                string_change = abs(pos['string'] - last_note.string)
                
                score -= position_change * 0.5
                score -= string_change * 0.2
            
            # Consider difficulty
            score -= pos['difficulty'] * 2.0
            
            # Store score
            scored_positions.append((score, pos))
        
        # Sort by score (highest first)
        scored_positions.sort(key=lambda x: x[0], reverse=True)
        
        return scored_positions[0][1]
    
    def _calculate_difficulty(self, string: int, fret: int) -> float:
        """포지션의 난이도 계산 (0-1)"""
        difficulty = 0.0
        
        # Open strings are easiest
        if fret == 0:
            return 0.0
        
        # Base difficulty increases with fret position
        difficulty += fret / 24.0 * 0.3
        
        # High frets are harder
        if fret > 12:
            difficulty += (fret - 12) / 12.0 * 0.3
        
        # Extreme strings slightly harder
        if string == 1 or string == 6:
            difficulty += 0.1
        
        # Very high frets on low strings are hardest
        if string <= 3 and fret > 15:
            difficulty += 0.2
        
        return min(difficulty, 1.0)
    
    def _get_hand_position(self, fret: int) -> int:
        """프렛에서 손 포지션 계산"""
        if fret == 0:
            return 0
        elif fret <= 4:
            return 1
        elif fret <= 7:
            return 5
        elif fret <= 10:
            return 8
        elif fret <= 14:
            return 12
        else:
            return 15
    
    def _group_into_measures(
        self,
        notes: List[Dict],
        time_signature: Tuple[int, int],
        tempo: float
    ) -> List[List[Dict]]:
        """노트를 마디로 그룹화"""
        
        if not notes:
            return []
        
        # Calculate measure duration in seconds
        beats_per_measure = time_signature[0]
        beat_duration = 60.0 / tempo
        measure_duration = beats_per_measure * beat_duration
        
        measures = []
        current_measure = []
        measure_start_time = 0.0
        
        for note in sorted(notes, key=lambda n: n['start']):
            # Check if note starts in current measure
            if note['start'] >= measure_start_time + measure_duration:
                # Start new measure
                if current_measure:
                    measures.append(current_measure)
                current_measure = []
                measure_start_time += measure_duration
            
            current_measure.append(note)
        
        # Add last measure
        if current_measure:
            measures.append(current_measure)
        
        return measures
    
    def _detect_chord_groups(self, notes: List[Dict]) -> List[List[Dict]]:
        """동시에 연주되는 노트 그룹 감지"""
        chord_groups = []
        tolerance = 0.05  # 50ms tolerance for "simultaneous"
        
        # Sort by start time
        sorted_notes = sorted(notes, key=lambda n: n['start'])
        
        current_group = []
        group_start = None
        
        for note in sorted_notes:
            if group_start is None:
                group_start = note['start']
                current_group = [note]
            elif abs(note['start'] - group_start) <= tolerance:
                current_group.append(note)
            else:
                if len(current_group) >= 2:  # At least 2 notes for a chord
                    chord_groups.append(current_group)
                group_start = note['start']
                current_group = [note]
        
        # Add last group
        if len(current_group) >= 2:
            chord_groups.append(current_group)
        
        return chord_groups
    
    def _assign_chord_fingerings(self, chord_notes: List[Dict]):
        """코드 노트에 최적의 핑거링 할당"""
        # Convert to guitar notes for chord detection
        temp_notes = []
        for note in chord_notes:
            positions = self._find_positions(note['pitch'])
            if positions:
                # Use first position temporarily
                temp_notes.append(GuitarNote(
                    pitch=note['pitch'],
                    start_time=note['start'],
                    end_time=note['end'],
                    string=positions[0]['string'],
                    fret=positions[0]['fret'],
                    velocity=note.get('velocity', 80)
                ))
        
        # Detect chord shape
        chord_shape = self.chord_detector.detect_chord_shape(temp_notes)
        
        if chord_shape:
            # Apply known chord fingering
            logger.info(f"Detected chord shape: {chord_shape}")
            for note in chord_notes:
                note['chord_shape'] = chord_shape
                note['is_chord_tone'] = True
    
    def _optimize_measure_fingering(self, measure: TabMeasure):
        """마디 내 핑거링 최적화"""
        if len(measure.notes) < 2:
            return
        
        # Group notes by time proximity
        note_groups = self._group_by_time_proximity(measure.notes)
        
        for group in note_groups:
            if len(group) > 1:
                self._optimize_group_fingering(group)
    
    def _group_by_time_proximity(
        self,
        notes: List[GuitarNote],
        threshold: float = 0.5
    ) -> List[List[GuitarNote]]:
        """시간적으로 가까운 노트들을 그룹화"""
        groups = []
        current_group = []
        
        for note in sorted(notes, key=lambda n: n.start_time):
            if not current_group:
                current_group = [note]
            elif note.start_time - current_group[-1].end_time <= threshold:
                current_group.append(note)
            else:
                groups.append(current_group)
                current_group = [note]
        
        if current_group:
            groups.append(current_group)
        
        return groups
    
    def _optimize_group_fingering(self, notes: List[GuitarNote]):
        """노트 그룹의 핑거링 최적화"""
        # Calculate average position
        avg_fret = sum(n.fret for n in notes) / len(notes)
        target_position = self._get_hand_position(int(avg_fret))
        
        # Try to keep all notes within one position
        for note in notes:
            current_position = self._get_hand_position(note.fret)
            if abs(current_position - target_position) > self.config.max_fret_span:
                # Find alternative position
                alternatives = self._find_positions(note.pitch)
                for alt in alternatives:
                    alt_position = self._get_hand_position(alt['fret'])
                    if abs(alt_position - target_position) <= self.config.max_fret_span:
                        note.string = alt['string']
                        note.fret = alt['fret']
                        note.difficulty = alt['difficulty']
                        break
    
    def _detect_techniques(self, measure: TabMeasure):
        """연주 기법 감지"""
        notes = sorted(measure.notes, key=lambda n: n.start_time)
        
        for i in range(len(notes)):
            current = notes[i]
            
            # Check for hammer-on/pull-off
            if i > 0:
                prev = notes[i - 1]
                if (current.string == prev.string and
                    abs(current.start_time - prev.end_time) < 0.05):
                    
                    if current.fret > prev.fret:
                        current.techniques.append(PlayingTechnique.HAMMER_ON)
                    elif current.fret < prev.fret:
                        current.techniques.append(PlayingTechnique.PULL_OFF)
            
            # Check for slides
            if i < len(notes) - 1:
                next_note = notes[i + 1]
                if (current.string == next_note.string and
                    current.end_time >= next_note.start_time and
                    abs(current.fret - next_note.fret) >= 2):
                    
                    if next_note.fret > current.fret:
                        current.techniques.append(PlayingTechnique.SLIDE_UP)
                    else:
                        current.techniques.append(PlayingTechnique.SLIDE_DOWN)
            
            # Check for bends (based on pitch bend data if available)
            # This would need pitch bend information from MIDI
            
            # Check for palm mutes (low velocity)
            if current.velocity < 40:
                current.techniques.append(PlayingTechnique.PALM_MUTE)
            
            # Check for harmonics (specific fret positions)
            harmonic_frets = [12, 7, 5, 4, 3]
            if current.fret in harmonic_frets and current.velocity > 100:
                current.techniques.append(PlayingTechnique.HARMONIC)


def convert_midi_to_tab(
    midi_notes: List[Dict],
    config: Optional[TabConfiguration] = None,
    **kwargs
) -> List[TabMeasure]:
    """Helper function for MIDI to Tab conversion"""
    converter = TabConverter(config)
    return converter.convert_midi_to_tab(midi_notes, **kwargs)


# Export classes and functions
__all__ = [
    'TabConverter',
    'TabConfiguration',
    'TabMeasure',
    'GuitarNote',
    'PlayingTechnique',
    'Tuning',
    'convert_midi_to_tab'
]


# Test code
if __name__ == "__main__":
    # Test data
    test_notes = [
        {'pitch': 64, 'start': 0.0, 'end': 0.5, 'velocity': 80},    # E4
        {'pitch': 67, 'start': 0.5, 'end': 1.0, 'velocity': 80},    # G4
        {'pitch': 60, 'start': 1.0, 'end': 1.5, 'velocity': 80},    # C4
        {'pitch': 64, 'start': 1.5, 'end': 2.0, 'velocity': 80},    # E4
        # Chord
        {'pitch': 60, 'start': 2.0, 'end': 3.0, 'velocity': 80},    # C
        {'pitch': 64, 'start': 2.0, 'end': 3.0, 'velocity': 80},    # E
        {'pitch': 67, 'start': 2.0, 'end': 3.0, 'velocity': 80},    # G
    ]
    
    config = TabConfiguration(
        tuning=Tuning.STANDARD.value,
        detect_chords=True,
        optimize_fingering=True
    )
    
    converter = TabConverter(config)
    tab_measures = converter.convert_midi_to_tab(test_notes)
    
    # Print results
    for measure in tab_measures:
        print(f"\nMeasure {measure.number}:")
        for note in measure.notes:
            techs = ", ".join([t.value for t in note.techniques]) if note.techniques else "normal"
            print(f"  String {note.string}, Fret {note.fret} @ {note.start_time:.2f}s "
                  f"(techniques: {techs}, difficulty: {note.difficulty:.2f})")
