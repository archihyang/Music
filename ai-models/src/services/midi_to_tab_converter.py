"""
MIDI to Guitar Tab Converter
Genesis Music - 전문가 수준의 Tab 변환 서비스

Features:
- MIDI to Tab conversion with multiple fingering options
- Intelligent position optimization
- Support for various guitar tunings
- Chord detection and fingering
- Rhythm notation (time signatures, bars)
- Special techniques (hammer-on, pull-off, slide, bend)
- Tab formatting for display/export
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, field
from enum import Enum
import asyncio

import numpy as np
import pretty_midi
from music21 import stream, note, chord, tempo, meter, key
from music21.analysis import discrete

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class Tuning(Enum):
    """기타 튜닝 프리셋"""
    STANDARD = [40, 45, 50, 55, 59, 64]  # E-A-D-G-B-E
    DROP_D = [38, 45, 50, 55, 59, 64]    # D-A-D-G-B-E
    HALF_STEP_DOWN = [39, 44, 49, 54, 58, 63]  # Eb-Ab-Db-Gb-Bb-Eb
    OPEN_G = [38, 43, 50, 55, 59, 62]    # D-G-D-G-B-D
    OPEN_D = [38, 45, 50, 54, 57, 62]    # D-A-D-F#-A-D
    DADGAD = [38, 45, 50, 55, 57, 62]    # D-A-D-G-A-D


class Technique(Enum):
    """특수 기법"""
    NORMAL = ""
    HAMMER_ON = "h"
    PULL_OFF = "p"
    SLIDE_UP = "/"
    SLIDE_DOWN = "\\"
    BEND = "b"
    RELEASE = "r"
    VIBRATO = "~"
    PALM_MUTE = "PM"
    HARMONIC = "<>"
    TAP = "t"


@dataclass
class TabNote:
    """탭 노트 데이터"""
    string: int  # 1-6 (high to low)
    fret: int    # 0-24
    start_time: float
    duration: float
    technique: Technique = Technique.NORMAL
    velocity: int = 80
    alternatives: List[Tuple[int, int]] = field(default_factory=list)  # (string, fret) alternatives


@dataclass
class TabMeasure:
    """탭 마디 데이터"""
    measure_number: int
    time_signature: Tuple[int, int]
    tempo: float
    notes: List[TabNote]
    chords: List[Dict[str, Any]]
    
    def get_tab_strings(self, string_count: int = 6) -> List[str]:
        """마디를 탭 문자열로 변환"""
        # Initialize tab lines
        tab_lines = [[] for _ in range(string_count)]
        
        # Sort notes by time
        sorted_notes = sorted(self.notes, key=lambda n: n.start_time)
        
        # Convert to tab format
        for note in sorted_notes:
            for string_idx in range(string_count):
                if string_idx + 1 == note.string:
                    # Add fret number with technique
                    fret_str = str(note.fret)
                    if note.technique != Technique.NORMAL:
                        fret_str += note.technique.value
                    tab_lines[string_idx].append(fret_str)
                else:
                    # Add dashes for spacing
                    tab_lines[string_idx].append("-" * len(str(note.fret)))
        
        # Join and format
        formatted_lines = []
        for line in tab_lines:
            formatted_lines.append("-".join(line) if line else "")
        
        return formatted_lines


@dataclass 
class TabConfig:
    """탭 변환 설정"""
    tuning: List[int] = field(default_factory=lambda: Tuning.STANDARD.value)
    capo: int = 0
    max_fret_span: int = 4  # Maximum frets hand can span
    prefer_low_positions: bool = True  # Prefer lower fret positions
    detect_chords: bool = True
    detect_techniques: bool = True
    quantize_timing: bool = True
    quantize_resolution: int = 16  # 16th notes
    include_rhythm_notation: bool = True
    tab_width: int = 80  # Characters per line


class MidiToTabConverter:
    """MIDI to Tab 변환기"""
    
    def __init__(self, config: Optional[TabConfig] = None):
        self.config = config or TabConfig()
        self.tuning = [note + self.config.capo for note in self.config.tuning]
        self.num_strings = len(self.tuning)
        self.max_fret = 24
        
        # Cache for optimization
        self.position_cache = {}
        self.chord_shapes = self._load_chord_shapes()
    
    async def convert_midi_to_tab(
        self, 
        midi_data: Union[str, Path, pretty_midi.PrettyMIDI]
    ) -> Dict[str, Any]:
        """MIDI 파일을 기타 탭으로 변환"""
        
        # Load MIDI
        if isinstance(midi_data, (str, Path)):
            midi_data = pretty_midi.PrettyMIDI(str(midi_data))
        
        # Extract notes and timing
        notes, timing_info = self._extract_midi_data(midi_data)
        
        # Convert to tab notes
        tab_notes = await self._convert_to_tab_notes(notes)
        
        # Detect chords if enabled
        chords = []
        if self.config.detect_chords:
            chords = self._detect_chords(tab_notes)
        
        # Detect techniques if enabled
        if self.config.detect_techniques:
            tab_notes = self._detect_techniques(tab_notes)
        
        # Organize into measures
        measures = self._organize_measures(tab_notes, chords, timing_info)
        
        # Generate tab notation
        tab_notation = self._generate_tab_notation(measures)
        
        # Generate additional info
        result = {
            'tab_notation': tab_notation,
            'measures': [self._measure_to_dict(m) for m in measures],
            'tuning': self.config.tuning,
            'capo': self.config.capo,
            'timing_info': timing_info,
            'statistics': {
                'total_notes': len(tab_notes),
                'total_measures': len(measures),
                'detected_chords': len(chords),
                'tempo': timing_info.get('tempo', 120)
            }
        }
        
        return result
    
    def _extract_midi_data(self, midi_data: pretty_midi.PrettyMIDI) -> Tuple[List, Dict]:
        """MIDI에서 노트와 타이밍 정보 추출"""
        notes = []
        
        # Extract notes from all instruments
        for instrument in midi_data.instruments:
            for note in instrument.notes:
                notes.append({
                    'pitch': note.pitch,
                    'start': note.start,
                    'end': note.end,
                    'velocity': note.velocity
                })
        
        # Sort by start time
        notes.sort(key=lambda n: n['start'])
        
        # Extract timing info
        timing_info = {
            'tempo': 120.0,  # Default
            'time_signatures': [(4, 4)]  # Default
        }
        
        # Get tempo changes
        tempo_changes = midi_data.get_tempo_changes()
        if tempo_changes[0].size > 0:
            timing_info['tempo'] = float(tempo_changes[1][0])
        
        # Get time signature changes
        if midi_data.time_signature_changes:
            timing_info['time_signatures'] = [
                (ts.numerator, ts.denominator) 
                for ts in midi_data.time_signature_changes
            ]
        
        logger.info(f"Extracted {len(notes)} notes, tempo: {timing_info['tempo']}")
        
        return notes, timing_info
    
    async def _convert_to_tab_notes(self, midi_notes: List[Dict]) -> List[TabNote]:
        """MIDI 노트를 탭 노트로 변환"""
        tab_notes = []
        previous_position = None
        
        for midi_note in midi_notes:
            pitch = midi_note['pitch']
            
            # Find possible positions
            positions = self._get_fret_positions(pitch)
            
            if not positions:
                logger.warning(f"Note {pitch} out of range for guitar")
                continue
            
            # Select optimal position
            optimal_pos = self._select_optimal_position(
                positions, 
                previous_position,
                midi_note.get('context', {})
            )
            
            # Create tab note
            tab_note = TabNote(
                string=optimal_pos[0],
                fret=optimal_pos[1],
                start_time=midi_note['start'],
                duration=midi_note['end'] - midi_note['start'],
                velocity=midi_note['velocity'],
                alternatives=[p for p in positions if p != optimal_pos]
            )
            
            tab_notes.append(tab_note)
            previous_position = optimal_pos
        
        return tab_notes
    
    def _get_fret_positions(self, midi_pitch: int) -> List[Tuple[int, int]]:
        """주어진 피치에 대한 가능한 (string, fret) 포지션"""
        positions = []
        
        for string_idx, open_pitch in enumerate(self.tuning):
            fret = midi_pitch - open_pitch
            
            if 0 <= fret <= self.max_fret:
                positions.append((string_idx + 1, fret))
        
        return positions
    
    def _select_optimal_position(
        self, 
        positions: List[Tuple[int, int]],
        previous: Optional[Tuple[int, int]],
        context: Dict
    ) -> Tuple[int, int]:
        """최적의 프렛 포지션 선택"""
        
        if not positions:
            return None
        
        # If no previous position, choose based on preference
        if previous is None:
            if self.config.prefer_low_positions:
                # Prefer lower frets
                return min(positions, key=lambda p: p[1])
            else:
                # Return middle position
                return positions[len(positions) // 2]
        
        # Calculate costs for each position
        position_costs = []
        
        for pos in positions:
            string_diff = abs(pos[0] - previous[0])
            fret_diff = abs(pos[1] - previous[1])
            
            # Base cost: minimize movement
            cost = string_diff * 3 + fret_diff
            
            # Penalize large stretches
            if fret_diff > self.config.max_fret_span:
                cost += (fret_diff - self.config.max_fret_span) * 5
            
            # Prefer staying on same string for melodic lines
            if context.get('melodic', False):
                cost += string_diff * 2
            
            # Consider hand position
            if self.config.prefer_low_positions and pos[1] > 12:
                cost += (pos[1] - 12) * 0.5
            
            position_costs.append((pos, cost))
        
        # Return position with minimum cost
        return min(position_costs, key=lambda x: x[1])[0]
    
    def _detect_chords(self, tab_notes: List[TabNote]) -> List[Dict]:
        """코드 검출"""
        chords = []
        
        # Group simultaneous notes
        time_threshold = 0.05  # 50ms
        note_groups = []
        current_group = []
        
        for note in sorted(tab_notes, key=lambda n: n.start_time):
            if not current_group or abs(note.start_time - current_group[-1].start_time) < time_threshold:
                current_group.append(note)
            else:
                if len(current_group) >= 3:  # Minimum for a chord
                    note_groups.append(current_group)
                current_group = [note]
        
        if len(current_group) >= 3:
            note_groups.append(current_group)
        
        # Analyze each group
        for group in note_groups:
            pitches = [self.tuning[n.string - 1] + n.fret for n in group]
            
            # Try to identify chord
            chord_info = self._identify_chord(pitches, group)
            if chord_info:
                chords.append({
                    'time': group[0].start_time,
                    'duration': max(n.duration for n in group),
                    'chord': chord_info,
                    'tab_positions': [(n.string, n.fret) for n in group]
                })
        
        return chords
    
    def _identify_chord(self, pitches: List[int], tab_notes: List[TabNote]) -> Optional[Dict]:
        """코드 식별"""
        # Convert to pitch classes
        pitch_classes = sorted(set(p % 12 for p in pitches))
        
        # Common chord patterns (intervals from root)
        chord_patterns = {
            'major': [0, 4, 7],
            'minor': [0, 3, 7],
            '7': [0, 4, 7, 10],
            'maj7': [0, 4, 7, 11],
            'm7': [0, 3, 7, 10],
            'sus2': [0, 2, 7],
            'sus4': [0, 5, 7],
            'dim': [0, 3, 6],
            'aug': [0, 4, 8]
        }
        
        # Try to match pattern
        for root_pc in range(12):
            for chord_type, pattern in chord_patterns.items():
                test_pattern = [(root_pc + interval) % 12 for interval in pattern]
                if set(test_pattern).issubset(set(pitch_classes)):
                    root_name = ['C', 'C#', 'D', 'D#', 'E', 'F', 
                                'F#', 'G', 'G#', 'A', 'A#', 'B'][root_pc]
                    
                    # Check for common chord shape
                    shape = self._find_chord_shape(tab_notes, root_name, chord_type)
                    
                    return {
                        'root': root_name,
                        'type': chord_type,
                        'shape': shape,
                        'pitches': pitches
                    }
        
        return None
    
    def _find_chord_shape(self, tab_notes: List[TabNote], root: str, chord_type: str) -> Optional[str]:
        """코드 shape 찾기"""
        # Common open chord shapes
        positions = [(n.string, n.fret) for n in tab_notes]
        positions_set = set(positions)
        
        # Check against known shapes
        for shape_name, shape_positions in self.chord_shapes.get(f"{root}{chord_type}", {}).items():
            if set(shape_positions).issubset(positions_set):
                return shape_name
        
        # Check for barre chord patterns
        frets = [n.fret for n in tab_notes if n.fret > 0]
        if frets and min(frets) == max(frets):
            return f"Barre {min(frets)}"
        
        return None
    
    def _detect_techniques(self, tab_notes: List[TabNote]) -> List[TabNote]:
        """특수 기법 검출"""
        
        for i in range(len(tab_notes)):
            if i == 0:
                continue
            
            prev_note = tab_notes[i - 1]
            curr_note = tab_notes[i]
            
            # Same string techniques
            if prev_note.string == curr_note.string:
                time_diff = curr_note.start_time - prev_note.start_time
                fret_diff = curr_note.fret - prev_note.fret
                
                # Hammer-on detection
                if fret_diff > 0 and time_diff < 0.1 and curr_note.velocity < prev_note.velocity:
                    curr_note.technique = Technique.HAMMER_ON
                
                # Pull-off detection
                elif fret_diff < 0 and time_diff < 0.1 and curr_note.velocity < prev_note.velocity:
                    curr_note.technique = Technique.PULL_OFF
                
                # Slide detection
                elif abs(fret_diff) > 1 and time_diff < 0.2:
                    if fret_diff > 0:
                        curr_note.technique = Technique.SLIDE_UP
                    else:
                        curr_note.technique = Technique.SLIDE_DOWN
        
        return tab_notes
    
    def _organize_measures(
        self, 
        tab_notes: List[TabNote], 
        chords: List[Dict],
        timing_info: Dict
    ) -> List[TabMeasure]:
        """노트를 마디로 구성"""
        measures = []
        
        tempo = timing_info.get('tempo', 120)
        time_sig = timing_info.get('time_signatures', [(4, 4)])[0]
        
        # Calculate measure duration
        beats_per_measure = time_sig[0]
        beat_duration = 60.0 / tempo
        measure_duration = beats_per_measure * beat_duration
        
        # Group notes into measures
        current_measure_notes = []
        current_measure_chords = []
        measure_start = 0
        measure_num = 1
        
        for note in tab_notes:
            if note.start_time < measure_start + measure_duration:
                current_measure_notes.append(note)
            else:
                # Create measure
                measures.append(TabMeasure(
                    measure_number=measure_num,
                    time_signature=time_sig,
                    tempo=tempo,
                    notes=current_measure_notes,
                    chords=[c for c in chords 
                           if measure_start <= c['time'] < measure_start + measure_duration]
                ))
                
                # Start new measure
                measure_num += 1
                measure_start += measure_duration
                current_measure_notes = [note]
        
        # Add final measure
        if current_measure_notes:
            measures.append(TabMeasure(
                measure_number=measure_num,
                time_signature=time_sig,
                tempo=tempo,
                notes=current_measure_notes,
                chords=[c for c in chords if c['time'] >= measure_start]
            ))
        
        return measures
    
    def _generate_tab_notation(self, measures: List[TabMeasure]) -> str:
        """탭 표기법 생성"""
        tab_output = []
        
        # Header
        tab_output.append(f"Tuning: {self._tuning_to_string()}")
        if self.config.capo > 0:
            tab_output.append(f"Capo: {self.config.capo}")
        tab_output.append("")
        
        # String labels
        string_labels = ['e', 'B', 'G', 'D', 'A', 'E'][:self.num_strings]
        
        # Generate tab for each measure
        for measure in measures:
            # Measure header
            header = f"Measure {measure.measure_number} "
            header += f"({measure.time_signature[0]}/{measure.time_signature[1]}) "
            header += f"♩={measure.tempo:.0f}"
            tab_output.append(header)
            
            # Get tab strings for measure
            tab_strings = measure.get_tab_strings(self.num_strings)
            
            # Add string labels and tab
            for i, (label, tab_line) in enumerate(zip(string_labels, tab_strings)):
                tab_output.append(f"{label}|{tab_line}|")
            
            tab_output.append("")  # Empty line between measures
        
        return "\n".join(tab_output)
    
    def _tuning_to_string(self) -> str:
        """튜닝을 문자열로 변환"""
        note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 
                     'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        tuning_notes = []
        for pitch in self.config.tuning:
            note_name = note_names[pitch % 12]
            octave = pitch // 12 - 1
            tuning_notes.append(f"{note_name}{octave}")
        
        return "-".join(tuning_notes)
    
    def _measure_to_dict(self, measure: TabMeasure) -> Dict:
        """마디를 딕셔너리로 변환"""
        return {
            'measure_number': measure.measure_number,
            'time_signature': f"{measure.time_signature[0]}/{measure.time_signature[1]}",
            'tempo': measure.tempo,
            'notes': [
                {
                    'string': n.string,
                    'fret': n.fret,
                    'start_time': n.start_time,
                    'duration': n.duration,
                    'technique': n.technique.name,
                    'alternatives': n.alternatives
                }
                for n in measure.notes
            ],
            'chords': measure.chords
        }
    
    def _load_chord_shapes(self) -> Dict:
        """코드 shape 데이터베이스 로드"""
        # Common open chord shapes (simplified)
        return {
            'Cmajor': {
                'open': [(2, 3), (3, 2), (5, 1)],
            },
            'Gmajor': {
                'open': [(1, 3), (2, 3), (6, 3)],
            },
            'Dmajor': {
                'open': [(1, 2), (2, 3), (3, 2)],
            },
            'Aminor': {
                'open': [(2, 2), (3, 2), (4, 1)],
            },
            'Eminor': {
                'open': [(3, 2), (4, 2)],
            },
            # Add more chord shapes as needed
        }


# Convenience function
async def convert_midi_file(
    midi_path: Union[str, Path],
    config: Optional[TabConfig] = None
) -> Dict[str, Any]:
    """MIDI 파일을 탭으로 변환하는 헬퍼 함수"""
    converter = MidiToTabConverter(config)
    return await converter.convert_midi_to_tab(midi_path)


# Test code
if __name__ == "__main__":
    async def test_conversion():
        """테스트 함수"""
        test_midi = "test_guitar.mid"
        
        config = TabConfig(
            tuning=Tuning.STANDARD.value,
            detect_chords=True,
            detect_techniques=True
        )
        
        try:
            result = await convert_midi_file(test_midi, config)
            
            print("Tab Conversion Complete!")
            print(f"Total notes: {result['statistics']['total_notes']}")
            print(f"Total measures: {result['statistics']['total_measures']}")
            print(f"Detected chords: {result['statistics']['detected_chords']}")
            print(f"\nTab Notation:\n")
            print(result['tab_notation'])
            
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
    
    # Run test
    asyncio.run(test_conversion())