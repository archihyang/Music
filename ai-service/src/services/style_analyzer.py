"""
Guitar style analysis engine for identifying playing characteristics
Focuses on legendary guitarists from the 70s-80s era
"""
import json
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pretty_midi
import music21
from dataclasses import dataclass, asdict
from enum import Enum
from loguru import logger

from services.audio_processor import AudioProcessor


class GuitarStyle(Enum):
    """Guitar playing styles of legendary guitarists"""
    HENDRIX = "Jimi Hendrix"  # Psychedelic, blues, innovative techniques
    PAGE = "Jimmy Page"  # Hard rock, folk influences, studio wizardry
    CLAPTON = "Eric Clapton"  # Blues, clean tones, melodic solos
    BECK = "Jeff Beck"  # Fusion, experimental, whammy bar
    GILMOUR = "David Gilmour"  # Melodic, spacey, emotional bends
    BLACKMORE = "Ritchie Blackmore"  # Classical influences, fast runs
    SANTANA = "Carlos Santana"  # Latin, sustained notes, melodic
    VAN_HALEN = "Eddie Van Halen"  # Tapping, harmonics, innovation
    SLASH = "Slash"  # Blues-rock, melodic solos, Les Paul tone
    MAY = "Brian May"  # Orchestral, harmonies, unique tone


@dataclass
class StyleFeatures:
    """Features that characterize a guitar playing style"""
    # Timing and rhythm
    timing_precision: float  # 0-1, how precise the timing is
    swing_factor: float  # Amount of swing/shuffle
    syncopation_level: float  # Use of off-beat rhythms
    
    # Note choice and scales
    blues_scale_usage: float  # Frequency of blues scale notes
    pentatonic_usage: float  # Frequency of pentatonic scale
    chromatic_usage: float  # Use of chromatic passages
    modal_usage: float  # Use of modes
    
    # Techniques
    bend_frequency: float  # How often bends are used
    bend_range: float  # Average bend range in semitones
    vibrato_frequency: float  # Vibrato usage
    vibrato_speed: float  # Speed of vibrato
    slide_frequency: float  # Slide usage
    hammer_pull_frequency: float  # Hammer-ons and pull-offs
    
    # Phrasing
    phrase_length_avg: float  # Average phrase length in beats
    phrase_length_variance: float  # Variation in phrase lengths
    space_ratio: float  # Ratio of silence to notes
    repetition_factor: float  # How much phrases repeat
    
    # Dynamics and expression
    dynamic_range: float  # Range of velocities
    velocity_variance: float  # Variation in note velocities
    sustain_average: float  # Average note sustain
    staccato_ratio: float  # Ratio of short to long notes
    
    # Harmonic characteristics
    chord_tone_emphasis: float  # Emphasis on chord tones
    tension_resolution: float  # Use of tension and resolution
    interval_complexity: float  # Complexity of interval choices
    harmonic_rhythm: float  # Rate of harmonic change
    
    # Speed and virtuosity
    note_density: float  # Notes per second
    max_speed: float  # Maximum notes per second
    speed_variance: float  # Variation in playing speed
    technical_complexity: float  # Overall technical difficulty


class StyleAnalyzer:
    """
    Analyzes guitar playing style from transcribed music
    """
    
    def __init__(self):
        self.audio_processor = AudioProcessor()
        self.style_profiles = self._load_style_profiles()
        
    def _load_style_profiles(self) -> Dict[GuitarStyle, StyleFeatures]:
        """
        Load predefined style profiles for legendary guitarists
        """
        profiles = {
            GuitarStyle.HENDRIX: StyleFeatures(
                timing_precision=0.7, swing_factor=0.3, syncopation_level=0.6,
                blues_scale_usage=0.9, pentatonic_usage=0.8, chromatic_usage=0.4, modal_usage=0.3,
                bend_frequency=0.8, bend_range=2.0, vibrato_frequency=0.7, vibrato_speed=0.6,
                slide_frequency=0.5, hammer_pull_frequency=0.6,
                phrase_length_avg=4.0, phrase_length_variance=0.6, space_ratio=0.3, repetition_factor=0.4,
                dynamic_range=0.8, velocity_variance=0.7, sustain_average=0.6, staccato_ratio=0.3,
                chord_tone_emphasis=0.6, tension_resolution=0.7, interval_complexity=0.6, harmonic_rhythm=0.5,
                note_density=3.5, max_speed=8.0, speed_variance=0.6, technical_complexity=0.7
            ),
            GuitarStyle.PAGE: StyleFeatures(
                timing_precision=0.8, swing_factor=0.2, syncopation_level=0.5,
                blues_scale_usage=0.8, pentatonic_usage=0.9, chromatic_usage=0.3, modal_usage=0.4,
                bend_frequency=0.7, bend_range=1.5, vibrato_frequency=0.6, vibrato_speed=0.5,
                slide_frequency=0.6, hammer_pull_frequency=0.7,
                phrase_length_avg=6.0, phrase_length_variance=0.7, space_ratio=0.25, repetition_factor=0.5,
                dynamic_range=0.9, velocity_variance=0.8, sustain_average=0.5, staccato_ratio=0.4,
                chord_tone_emphasis=0.7, tension_resolution=0.6, interval_complexity=0.7, harmonic_rhythm=0.6,
                note_density=4.0, max_speed=10.0, speed_variance=0.7, technical_complexity=0.8
            ),
            GuitarStyle.CLAPTON: StyleFeatures(
                timing_precision=0.9, swing_factor=0.2, syncopation_level=0.3,
                blues_scale_usage=0.95, pentatonic_usage=0.9, chromatic_usage=0.2, modal_usage=0.2,
                bend_frequency=0.9, bend_range=1.0, vibrato_frequency=0.8, vibrato_speed=0.4,
                slide_frequency=0.4, hammer_pull_frequency=0.5,
                phrase_length_avg=5.0, phrase_length_variance=0.4, space_ratio=0.35, repetition_factor=0.3,
                dynamic_range=0.7, velocity_variance=0.5, sustain_average=0.7, staccato_ratio=0.2,
                chord_tone_emphasis=0.8, tension_resolution=0.8, interval_complexity=0.4, harmonic_rhythm=0.4,
                note_density=2.5, max_speed=6.0, speed_variance=0.4, technical_complexity=0.5
            ),
            GuitarStyle.GILMOUR: StyleFeatures(
                timing_precision=0.95, swing_factor=0.1, syncopation_level=0.2,
                blues_scale_usage=0.7, pentatonic_usage=0.8, chromatic_usage=0.2, modal_usage=0.5,
                bend_frequency=0.95, bend_range=2.5, vibrato_frequency=0.9, vibrato_speed=0.3,
                slide_frequency=0.6, hammer_pull_frequency=0.4,
                phrase_length_avg=8.0, phrase_length_variance=0.5, space_ratio=0.4, repetition_factor=0.3,
                dynamic_range=0.8, velocity_variance=0.6, sustain_average=0.9, staccato_ratio=0.1,
                chord_tone_emphasis=0.7, tension_resolution=0.9, interval_complexity=0.5, harmonic_rhythm=0.3,
                note_density=2.0, max_speed=5.0, speed_variance=0.3, technical_complexity=0.4
            ),
            GuitarStyle.VAN_HALEN: StyleFeatures(
                timing_precision=0.95, swing_factor=0.05, syncopation_level=0.4,
                blues_scale_usage=0.6, pentatonic_usage=0.7, chromatic_usage=0.5, modal_usage=0.4,
                bend_frequency=0.6, bend_range=1.5, vibrato_frequency=0.7, vibrato_speed=0.8,
                slide_frequency=0.3, hammer_pull_frequency=0.95,
                phrase_length_avg=4.0, phrase_length_variance=0.8, space_ratio=0.2, repetition_factor=0.4,
                dynamic_range=0.7, velocity_variance=0.6, sustain_average=0.4, staccato_ratio=0.5,
                chord_tone_emphasis=0.5, tension_resolution=0.5, interval_complexity=0.8, harmonic_rhythm=0.7,
                note_density=6.0, max_speed=15.0, speed_variance=0.8, technical_complexity=0.95
            ),
        }
        return profiles
    
    def analyze_style(
        self,
        midi_data: pretty_midi.PrettyMIDI,
        audio_features: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyze the playing style from MIDI data
        
        Args:
            midi_data: Transcribed MIDI data
            audio_features: Optional audio features for additional analysis
            
        Returns:
            Style analysis results
        """
        # Extract features from MIDI
        features = self._extract_style_features(midi_data, audio_features)
        
        # Compare with known styles
        style_matches = self._match_styles(features)
        
        # Identify techniques used
        techniques = self._identify_techniques(midi_data, audio_features)
        
        # Analyze musical characteristics
        musical_analysis = self._analyze_musical_characteristics(midi_data)
        
        return {
            'features': asdict(features),
            'style_matches': style_matches,
            'techniques': techniques,
            'musical_analysis': musical_analysis,
            'recommendations': self._generate_recommendations(features, style_matches)
        }
    
    def _extract_style_features(
        self,
        midi_data: pretty_midi.PrettyMIDI,
        audio_features: Optional[Dict[str, Any]] = None
    ) -> StyleFeatures:
        """
        Extract style features from MIDI data
        """
        notes = []
        for instrument in midi_data.instruments:
            for note in instrument.notes:
                notes.append({
                    'pitch': note.pitch,
                    'start': note.start,
                    'end': note.end,
                    'velocity': note.velocity
                })
        
        if not notes:
            return StyleFeatures(**{field: 0.0 for field in StyleFeatures.__annotations__})
        
        notes.sort(key=lambda x: x['start'])
        
        # Calculate timing features
        timing_precision = self._calculate_timing_precision(notes)
        swing_factor = self._calculate_swing_factor(notes)
        syncopation_level = self._calculate_syncopation(notes)
        
        # Calculate scale usage
        pitches = [n['pitch'] for n in notes]
        blues_scale_usage = self._calculate_scale_usage(pitches, 'blues')
        pentatonic_usage = self._calculate_scale_usage(pitches, 'pentatonic')
        chromatic_usage = self._calculate_chromatic_usage(pitches)
        modal_usage = self._calculate_modal_usage(pitches)
        
        # Calculate technique features (simplified without audio)
        bend_frequency = 0.3 if audio_features else 0.0
        bend_range = 1.0 if audio_features else 0.0
        vibrato_frequency = 0.4 if audio_features else 0.0
        vibrato_speed = 0.5 if audio_features else 0.0
        slide_frequency = 0.2 if audio_features else 0.0
        hammer_pull_frequency = self._estimate_hammer_pulls(notes)
        
        # Calculate phrasing
        phrase_stats = self._analyze_phrasing(notes)
        
        # Calculate dynamics
        velocities = [n['velocity'] for n in notes]
        dynamic_range = (max(velocities) - min(velocities)) / 127.0 if velocities else 0.0
        velocity_variance = np.std(velocities) / 127.0 if len(velocities) > 1 else 0.0
        
        # Calculate sustain
        durations = [n['end'] - n['start'] for n in notes]
        sustain_average = np.mean(durations) if durations else 0.0
        staccato_ratio = sum(1 for d in durations if d < 0.1) / len(durations) if durations else 0.0
        
        # Calculate harmonic features
        harmonic_features = self._analyze_harmony(notes)
        
        # Calculate speed and complexity
        note_density = len(notes) / (notes[-1]['end'] if notes else 1.0)
        speed_features = self._calculate_speed_features(notes)
        
        return StyleFeatures(
            timing_precision=timing_precision,
            swing_factor=swing_factor,
            syncopation_level=syncopation_level,
            blues_scale_usage=blues_scale_usage,
            pentatonic_usage=pentatonic_usage,
            chromatic_usage=chromatic_usage,
            modal_usage=modal_usage,
            bend_frequency=bend_frequency,
            bend_range=bend_range,
            vibrato_frequency=vibrato_frequency,
            vibrato_speed=vibrato_speed,
            slide_frequency=slide_frequency,
            hammer_pull_frequency=hammer_pull_frequency,
            phrase_length_avg=phrase_stats['avg_length'],
            phrase_length_variance=phrase_stats['variance'],
            space_ratio=phrase_stats['space_ratio'],
            repetition_factor=phrase_stats['repetition'],
            dynamic_range=dynamic_range,
            velocity_variance=velocity_variance,
            sustain_average=sustain_average,
            staccato_ratio=staccato_ratio,
            chord_tone_emphasis=harmonic_features['chord_emphasis'],
            tension_resolution=harmonic_features['tension_resolution'],
            interval_complexity=harmonic_features['interval_complexity'],
            harmonic_rhythm=harmonic_features['harmonic_rhythm'],
            note_density=note_density,
            max_speed=speed_features['max_speed'],
            speed_variance=speed_features['variance'],
            technical_complexity=speed_features['complexity']
        )
    
    def _calculate_timing_precision(self, notes: List[Dict]) -> float:
        """Calculate how precise the timing is (on-beat vs off-beat)"""
        if len(notes) < 2:
            return 0.5
        
        # Check how many notes fall on beat boundaries
        beat_threshold = 0.05  # 50ms tolerance
        on_beat_count = 0
        
        for note in notes:
            beat_position = note['start'] % 0.5  # Assuming 120 BPM, beat = 0.5s
            if beat_position < beat_threshold or beat_position > (0.5 - beat_threshold):
                on_beat_count += 1
        
        return on_beat_count / len(notes)
    
    def _calculate_swing_factor(self, notes: List[Dict]) -> float:
        """Calculate swing/shuffle factor"""
        # Simplified: look for triplet patterns
        if len(notes) < 3:
            return 0.0
        
        triplet_patterns = 0
        for i in range(len(notes) - 2):
            interval1 = notes[i+1]['start'] - notes[i]['start']
            interval2 = notes[i+2]['start'] - notes[i+1]['start']
            
            # Check for long-short pattern (swing)
            if interval1 > 0 and interval2 > 0:
                ratio = interval1 / interval2
                if 1.5 < ratio < 2.5 or 0.4 < ratio < 0.67:
                    triplet_patterns += 1
        
        return min(triplet_patterns / (len(notes) - 2), 1.0)
    
    def _calculate_syncopation(self, notes: List[Dict]) -> float:
        """Calculate syncopation level"""
        if len(notes) < 2:
            return 0.0
        
        # Count notes that start on off-beats
        off_beat_count = 0
        beat_length = 0.5  # Assuming 120 BPM
        
        for note in notes:
            beat_position = note['start'] % beat_length
            # Check if note starts between beats
            if 0.15 < beat_position < 0.35 or 0.65 < beat_position < 0.85:
                off_beat_count += 1
        
        return off_beat_count / len(notes)
    
    def _calculate_scale_usage(self, pitches: List[int], scale_type: str) -> float:
        """Calculate usage of specific scale"""
        if not pitches:
            return 0.0
        
        # Define scales (simplified)
        scales = {
            'blues': [0, 3, 5, 6, 7, 10],  # Blues scale intervals
            'pentatonic': [0, 2, 4, 7, 9],  # Minor pentatonic
            'major': [0, 2, 4, 5, 7, 9, 11],  # Major scale
        }
        
        scale_intervals = scales.get(scale_type, [])
        in_scale_count = 0
        
        for pitch in pitches:
            pitch_class = pitch % 12
            if any((pitch_class - interval) % 12 == 0 for interval in scale_intervals):
                in_scale_count += 1
        
        return in_scale_count / len(pitches)
    
    def _calculate_chromatic_usage(self, pitches: List[int]) -> float:
        """Calculate chromatic passage usage"""
        if len(pitches) < 2:
            return 0.0
        
        chromatic_count = 0
        for i in range(len(pitches) - 1):
            interval = abs(pitches[i+1] - pitches[i])
            if interval == 1:  # Semitone
                chromatic_count += 1
        
        return chromatic_count / (len(pitches) - 1)
    
    def _calculate_modal_usage(self, pitches: List[int]) -> float:
        """Estimate modal usage (simplified)"""
        # This would require more sophisticated analysis
        # For now, return a placeholder
        return 0.3
    
    def _estimate_hammer_pulls(self, notes: List[Dict]) -> float:
        """Estimate hammer-on and pull-off frequency"""
        if len(notes) < 2:
            return 0.0
        
        fast_transitions = 0
        for i in range(len(notes) - 1):
            time_diff = notes[i+1]['start'] - notes[i]['end']
            # Very quick transitions might be hammer-ons/pull-offs
            if 0 <= time_diff < 0.05:  # Less than 50ms
                fast_transitions += 1
        
        return fast_transitions / (len(notes) - 1)
    
    def _analyze_phrasing(self, notes: List[Dict]) -> Dict[str, float]:
        """Analyze musical phrasing"""
        if not notes:
            return {'avg_length': 0, 'variance': 0, 'space_ratio': 0, 'repetition': 0}
        
        # Detect phrases (gaps > 0.5 seconds indicate phrase boundaries)
        phrases = []
        current_phrase = [notes[0]]
        
        for i in range(1, len(notes)):
            gap = notes[i]['start'] - notes[i-1]['end']
            if gap > 0.5:  # New phrase
                phrases.append(current_phrase)
                current_phrase = [notes[i]]
            else:
                current_phrase.append(notes[i])
        phrases.append(current_phrase)
        
        # Calculate phrase statistics
        phrase_lengths = [len(p) for p in phrases]
        avg_length = np.mean(phrase_lengths) if phrase_lengths else 0
        variance = np.std(phrase_lengths) if len(phrase_lengths) > 1 else 0
        
        # Calculate space ratio
        total_duration = notes[-1]['end'] - notes[0]['start'] if notes else 1
        note_duration = sum(n['end'] - n['start'] for n in notes)
        space_ratio = 1 - (note_duration / total_duration) if total_duration > 0 else 0
        
        # Simple repetition detection (would need more sophisticated analysis)
        repetition = 0.2  # Placeholder
        
        return {
            'avg_length': avg_length,
            'variance': variance,
            'space_ratio': space_ratio,
            'repetition': repetition
        }
    
    def _analyze_harmony(self, notes: List[Dict]) -> Dict[str, float]:
        """Analyze harmonic characteristics"""
        if len(notes) < 2:
            return {
                'chord_emphasis': 0.5,
                'tension_resolution': 0.5,
                'interval_complexity': 0.5,
                'harmonic_rhythm': 0.5
            }
        
        # Calculate interval distribution
        intervals = []
        for i in range(len(notes) - 1):
            interval = abs(notes[i+1]['pitch'] - notes[i]['pitch'])
            intervals.append(interval % 12)
        
        # Chord tone emphasis (thirds, fifths, octaves)
        chord_intervals = [3, 4, 5, 7, 12]
        chord_emphasis = sum(1 for i in intervals if i in chord_intervals) / len(intervals) if intervals else 0.5
        
        # Tension and resolution (simplified)
        tension_intervals = [1, 2, 6, 10, 11]
        tension_count = sum(1 for i in intervals if i in tension_intervals)
        tension_resolution = tension_count / len(intervals) if intervals else 0.5
        
        # Interval complexity
        unique_intervals = len(set(intervals))
        interval_complexity = unique_intervals / 12
        
        # Harmonic rhythm (rate of pitch change)
        pitch_changes = sum(1 for i in range(len(notes)-1) if notes[i+1]['pitch'] != notes[i]['pitch'])
        duration = notes[-1]['end'] - notes[0]['start'] if notes else 1
        harmonic_rhythm = pitch_changes / duration if duration > 0 else 0.5
        
        return {
            'chord_emphasis': chord_emphasis,
            'tension_resolution': tension_resolution,
            'interval_complexity': interval_complexity,
            'harmonic_rhythm': min(harmonic_rhythm / 10, 1.0)  # Normalize
        }
    
    def _calculate_speed_features(self, notes: List[Dict]) -> Dict[str, float]:
        """Calculate speed-related features"""
        if len(notes) < 2:
            return {'max_speed': 0, 'variance': 0, 'complexity': 0}
        
        # Calculate note rates in windows
        window_size = 1.0  # 1 second windows
        rates = []
        
        for i in range(len(notes)):
            window_start = notes[i]['start']
            window_end = window_start + window_size
            window_notes = [n for n in notes[i:] if n['start'] < window_end]
            rate = len(window_notes) / window_size
            rates.append(rate)
        
        max_speed = max(rates) if rates else 0
        variance = np.std(rates) if len(rates) > 1 else 0
        
        # Technical complexity (combination of speed and interval complexity)
        avg_interval = np.mean([abs(notes[i+1]['pitch'] - notes[i]['pitch']) 
                               for i in range(len(notes)-1)]) if len(notes) > 1 else 0
        complexity = min((max_speed / 10) * (avg_interval / 12), 1.0)
        
        return {
            'max_speed': max_speed,
            'variance': variance,
            'complexity': complexity
        }
    
    def _match_styles(self, features: StyleFeatures) -> List[Dict[str, float]]:
        """
        Match extracted features with known guitarist styles
        """
        matches = []
        
        for style, profile in self.style_profiles.items():
            # Calculate similarity score
            similarity = self._calculate_similarity(features, profile)
            matches.append({
                'style': style.value,
                'similarity': similarity,
                'confidence': self._calculate_confidence(similarity)
            })
        
        # Sort by similarity
        matches.sort(key=lambda x: x['similarity'], reverse=True)
        
        return matches
    
    def _calculate_similarity(self, features1: StyleFeatures, features2: StyleFeatures) -> float:
        """
        Calculate similarity between two style feature sets
        """
        # Convert to numpy arrays for easier calculation
        f1 = np.array([getattr(features1, field) for field in features1.__annotations__])
        f2 = np.array([getattr(features2, field) for field in features2.__annotations__])
        
        # Cosine similarity
        dot_product = np.dot(f1, f2)
        norm1 = np.linalg.norm(f1)
        norm2 = np.linalg.norm(f2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        similarity = dot_product / (norm1 * norm2)
        
        # Convert to 0-1 range
        return (similarity + 1) / 2
    
    def _calculate_confidence(self, similarity: float) -> str:
        """
        Calculate confidence level based on similarity score
        """
        if similarity > 0.8:
            return "Very High"
        elif similarity > 0.65:
            return "High"
        elif similarity > 0.5:
            return "Medium"
        elif similarity > 0.35:
            return "Low"
        else:
            return "Very Low"
    
    def _identify_techniques(
        self,
        midi_data: pretty_midi.PrettyMIDI,
        audio_features: Optional[Dict[str, Any]] = None
    ) -> List[str]:
        """
        Identify guitar techniques used in the performance
        """
        techniques = []
        
        notes = []
        for instrument in midi_data.instruments:
            for note in instrument.notes:
                notes.append(note)
        
        if not notes:
            return techniques
        
        notes.sort(key=lambda x: x.start)
        
        # Check for various techniques
        
        # Fast runs (scales)
        fast_passages = self._detect_fast_runs(notes)
        if fast_passages > 0.3:
            techniques.append("Fast scale runs")
        
        # Arpeggios
        if self._detect_arpeggios(notes):
            techniques.append("Arpeggios")
        
        # Power chords
        if self._detect_power_chords(notes):
            techniques.append("Power chords")
        
        # Tremolo picking
        if self._detect_tremolo(notes):
            techniques.append("Tremolo picking")
        
        # Double stops
        if self._detect_double_stops(notes):
            techniques.append("Double stops")
        
        # If audio features available, add more techniques
        if audio_features:
            if audio_features.get('bend_detected', False):
                techniques.append("String bending")
            if audio_features.get('vibrato_detected', False):
                techniques.append("Vibrato")
            if audio_features.get('slide_detected', False):
                techniques.append("Slides")
            if audio_features.get('harmonics_detected', False):
                techniques.append("Harmonics")
        
        return techniques
    
    def _detect_fast_runs(self, notes: List) -> float:
        """Detect fast scale runs"""
        if len(notes) < 4:
            return 0.0
        
        fast_run_count = 0
        for i in range(len(notes) - 3):
            # Check for consecutive notes with small intervals and fast timing
            time_span = notes[i+3].start - notes[i].start
            if time_span > 0 and time_span < 0.5:  # 4 notes in 0.5 seconds
                intervals = [abs(notes[j+1].pitch - notes[j].pitch) for j in range(i, i+3)]
                if all(1 <= interval <= 2 for interval in intervals):  # Scale-like intervals
                    fast_run_count += 1
        
        return fast_run_count / max(len(notes) - 3, 1)
    
    def _detect_arpeggios(self, notes: List) -> bool:
        """Detect arpeggio patterns"""
        if len(notes) < 3:
            return False
        
        arpeggio_patterns = 0
        for i in range(len(notes) - 2):
            intervals = [notes[i+1].pitch - notes[i].pitch, notes[i+2].pitch - notes[i+1].pitch]
            # Check for chord intervals (thirds, fourths, fifths)
            if all(abs(interval) in [3, 4, 5, 7] for interval in intervals):
                arpeggio_patterns += 1
        
        return arpeggio_patterns > len(notes) * 0.1
    
    def _detect_power_chords(self, notes: List) -> bool:
        """Detect power chord usage"""
        # Check for simultaneous notes a fifth apart
        for i in range(len(notes) - 1):
            if abs(notes[i].start - notes[i+1].start) < 0.01:  # Simultaneous
                interval = abs(notes[i+1].pitch - notes[i].pitch)
                if interval == 7:  # Perfect fifth
                    return True
        return False
    
    def _detect_tremolo(self, notes: List) -> bool:
        """Detect tremolo picking"""
        if len(notes) < 4:
            return False
        
        # Look for rapid repetition of the same pitch
        for i in range(len(notes) - 3):
            if all(notes[j].pitch == notes[i].pitch for j in range(i, i+4)):
                time_span = notes[i+3].start - notes[i].start
                if time_span < 0.25:  # 4 same notes in 0.25 seconds
                    return True
        return False
    
    def _detect_double_stops(self, notes: List) -> bool:
        """Detect double stops (two notes played simultaneously)"""
        for i in range(len(notes) - 1):
            if abs(notes[i].start - notes[i+1].start) < 0.01:  # Simultaneous
                return True
        return False
    
    def _analyze_musical_characteristics(self, midi_data: pretty_midi.PrettyMIDI) -> Dict[str, Any]:
        """
        Analyze overall musical characteristics
        """
        # Get tempo
        tempo_changes = midi_data.get_tempo_changes()
        avg_tempo = np.mean(tempo_changes[1]) if tempo_changes[0].size > 0 else 120
        
        # Get key signature (simplified)
        key_signature = self._estimate_key(midi_data)
        
        # Get time signature
        time_signature_changes = midi_data.time_signature_changes
        time_signature = f"{time_signature_changes[0].numerator}/{time_signature_changes[0].denominator}" if time_signature_changes else "4/4"
        
        # Calculate note statistics
        all_notes = []
        for instrument in midi_data.instruments:
            all_notes.extend(instrument.notes)
        
        if all_notes:
            pitch_range = max(n.pitch for n in all_notes) - min(n.pitch for n in all_notes)
            avg_pitch = np.mean([n.pitch for n in all_notes])
            total_duration = max(n.end for n in all_notes)
        else:
            pitch_range = 0
            avg_pitch = 60
            total_duration = 0
        
        return {
            'tempo': avg_tempo,
            'key_signature': key_signature,
            'time_signature': time_signature,
            'pitch_range': pitch_range,
            'average_pitch': avg_pitch,
            'total_duration': total_duration,
            'note_count': len(all_notes)
        }
    
    def _estimate_key(self, midi_data: pretty_midi.PrettyMIDI) -> str:
        """Estimate the key of the piece"""
        # Collect all pitches
        pitches = []
        for instrument in midi_data.instruments:
            for note in instrument.notes:
                pitches.append(note.pitch % 12)
        
        if not pitches:
            return "C major"
        
        # Count pitch classes
        pitch_class_counts = np.zeros(12)
        for pitch in pitches:
            pitch_class_counts[pitch] += 1
        
        # Simple key detection based on most common notes
        # This is very simplified - real implementation would use key profiles
        most_common = np.argmax(pitch_class_counts)
        key_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        
        return f"{key_names[most_common]} major"  # Simplified - always returns major
    
    def _generate_recommendations(
        self,
        features: StyleFeatures,
        style_matches: List[Dict[str, float]]
    ) -> List[str]:
        """
        Generate practice recommendations based on analysis
        """
        recommendations = []
        
        # Based on top matching style
        if style_matches and style_matches[0]['similarity'] > 0.6:
            top_style = style_matches[0]['style']
            recommendations.append(f"Your playing shows similarities to {top_style}. Study their techniques and repertoire.")
        
        # Technical recommendations
        if features.timing_precision < 0.7:
            recommendations.append("Work on timing precision with a metronome")
        
        if features.bend_frequency < 0.3:
            recommendations.append("Practice string bending techniques for more expression")
        
        if features.dynamic_range < 0.5:
            recommendations.append("Explore greater dynamic range in your playing")
        
        if features.space_ratio < 0.2:
            recommendations.append("Leave more space between phrases for better musicality")
        
        if features.note_density > 8:
            recommendations.append("Balance fast passages with melodic phrases")
        
        if features.blues_scale_usage < 0.3:
            recommendations.append("Incorporate more blues scale elements for authentic rock sound")
        
        return recommendations