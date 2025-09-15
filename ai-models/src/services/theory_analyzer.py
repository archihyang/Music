"""
Theory Analyzer Service
Analyzes music theory aspects including chord progressions,
modal interchange, and secondary dominants
"""

import music21
from typing import Dict, List, Optional, Tuple
import numpy as np

class TheoryAnalyzer:
    def __init__(self):
        self.ready = True
        
    def is_ready(self) -> bool:
        """Check if service is ready"""
        return self.ready
    
    async def analyze(self, midi_data: Dict) -> Dict:
        """
        Analyze music theory from MIDI data
        
        Args:
            midi_data: Dictionary containing notes, tempo, key, etc.
            
        Returns:
            Theory analysis results
        """
        try:
            # Convert MIDI data to music21 stream
            stream = self._create_stream_from_midi(midi_data)
            
            # Analyze key
            key_analysis = self._analyze_key(stream)
            
            # Extract chord progression
            chord_progression = self._extract_chords(stream)
            
            # Analyze roman numerals
            roman_numerals = self._analyze_roman_numerals(
                chord_progression,
                key_analysis['key']
            )
            
            # Detect modal interchange
            modal_interchanges = self._detect_modal_interchange(
                chord_progression,
                key_analysis
            )
            
            # Detect secondary dominants
            secondary_dominants = self._detect_secondary_dominants(
                chord_progression,
                key_analysis['key']
            )
            
            return {
                'key': key_analysis['key'],
                'mode': key_analysis['mode'],
                'chord_progression': chord_progression,
                'roman_numerals': roman_numerals,
                'modal_interchanges': modal_interchanges,
                'secondary_dominants': secondary_dominants,
                'time_signature': midi_data.get('time_signature', [4, 4])
            }
            
        except Exception as e:
            print(f"Theory analysis error: {e}")
            raise
    
    def _create_stream_from_midi(self, midi_data: Dict) -> music21.stream.Stream:
        """Create music21 stream from MIDI data"""
        stream = music21.stream.Stream()
        
        # Set tempo
        tempo_marking = music21.tempo.MetronomeMark(
            number=midi_data.get('tempo', 120)
        )
        stream.append(tempo_marking)
        
        # Add notes
        for note_data in midi_data.get('notes', []):
            note = music21.note.Note(
                midi=note_data['pitch'],
                quarterLength=note_data['duration'] * 4  # Convert to quarters
            )
            note.offset = note_data['start'] * 4
            stream.append(note)
        
        return stream
    
    def _analyze_key(self, stream: music21.stream.Stream) -> Dict:
        """Analyze the key and mode of the piece"""
        key = stream.analyze('key')
        
        # Determine mode
        mode = 'Major' if key.mode == 'major' else 'Minor'
        if key.mode == 'minor':
            # Further analyze minor mode type
            # (natural, harmonic, melodic)
            mode = self._determine_minor_type(stream, key)
        
        return {
            'key': str(key),
            'tonic': key.tonic.name,
            'mode': mode,
            'confidence': key.correlationCoefficient
        }
    
    def _extract_chords(self, stream: music21.stream.Stream) -> List[Dict]:
        """Extract chord progression from stream"""
        chords = []
        
        # Segment stream into beats/measures
        # Simplified chord extraction
        for measure in stream.getElementsByClass(music21.stream.Measure):
            chord_tones = []
            
            for element in measure.flatten().notes:
                if isinstance(element, music21.note.Note):
                    chord_tones.append(element.pitch)
            
            if chord_tones:
                chord = music21.chord.Chord(chord_tones)
                chords.append({
                    'root': chord.root().name if chord.root() else 'N/A',
                    'quality': self._determine_chord_quality(chord),
                    'beat': measure.offset,
                    'bass': chord.bass().name if chord.bass() else None
                })
        
        return chords
    
    def _determine_chord_quality(self, chord: music21.chord.Chord) -> str:
        """Determine chord quality (major, minor, etc.)"""
        if chord.isMajorTriad():
            return 'maj'
        elif chord.isMinorTriad():
            return 'min'
        elif chord.isDominantSeventh():
            return '7'
        elif chord.isDiminishedSeventh():
            return 'dim7'
        elif chord.isHalfDiminishedSeventh():
            return 'm7b5'
        else:
            # More complex chord identification
            return chord.commonName if hasattr(chord, 'commonName') else 'unknown'
    
    def _analyze_roman_numerals(
        self,
        chord_progression: List[Dict],
        key: str
    ) -> List[str]:
        """Convert chord progression to Roman numeral analysis"""
        roman_numerals = []
        key_obj = music21.key.Key(key)
        
        for chord in chord_progression:
            try:
                # Create chord object
                chord_obj = music21.chord.Chord(
                    [chord['root'] + '3', chord['root'] + '5']
                )
                
                # Get Roman numeral
                rn = music21.roman.romanNumeralFromChord(
                    chord_obj,
                    key_obj
                )
                roman_numerals.append(str(rn.romanNumeral))
                
            except:
                roman_numerals.append('?')
        
        return roman_numerals
    
    def _detect_modal_interchange(
        self,
        chord_progression: List[Dict],
        key_analysis: Dict
    ) -> List[Dict]:
        """Detect borrowed chords from parallel modes"""
        modal_interchanges = []
        
        # Common borrowed chords in major keys
        major_borrowed = {
            'bIII': 'Natural Minor',
            'bVI': 'Natural Minor',
            'bVII': 'Natural Minor',
            'iv': 'Natural Minor',
            'ii°': 'Phrygian',
            'bII': 'Phrygian/Neapolitan'
        }
        
        # Common borrowed chords in minor keys
        minor_borrowed = {
            'I': 'Major (Picardy)',
            'IV': 'Dorian',
            'VII': 'Dorian',
            'V': 'Harmonic Minor'
        }
        
        # Analyze each chord for modal interchange
        for i, chord in enumerate(chord_progression):
            # Simplified detection
            # In production, would use more sophisticated analysis
            pass
        
        return modal_interchanges
    
    def _detect_secondary_dominants(
        self,
        chord_progression: List[Dict],
        key: str
    ) -> List[Dict]:
        """Detect secondary dominant chords (V/x)"""
        secondary_dominants = []
        
        for i in range(len(chord_progression) - 1):
            current = chord_progression[i]
            next_chord = chord_progression[i + 1]
            
            # Check if current chord is dominant of next chord
            if self._is_dominant_of(current, next_chord):
                secondary_dominants.append({
                    'chord': f"{current['root']}7",
                    'target_chord': next_chord['root'],
                    'measure': i + 1,
                    'type': f"V/{next_chord['root']}"
                })
        
        return secondary_dominants
    
    def _is_dominant_of(self, chord1: Dict, chord2: Dict) -> bool:
        """Check if chord1 is dominant of chord2"""
        # Simplified check - in production would be more thorough
        try:
            # Get pitch classes
            pc1 = music21.pitch.Pitch(chord1['root']).pitchClass
            pc2 = music21.pitch.Pitch(chord2['root']).pitchClass
            
            # Check if chord1 is perfect fifth above chord2
            return (pc1 - pc2) % 12 == 7
        except:
            return False
    
    def _determine_minor_type(
        self,
        stream: music21.stream.Stream,
        key: music21.key.Key
    ) -> str:
        """Determine type of minor scale used"""
        # Analyze for raised 7th (harmonic) or raised 6th & 7th (melodic)
        # Simplified implementation
        return 'Natural Minor'

    def detect_modulations(self, stream: music21.stream.Stream) -> List[Dict]:
        """Detect key modulations in the piece"""
        modulations = []
        
        # Window-based key analysis
        window_size = 4  # measures
        
        # TODO: Implement sliding window key detection
        
        return modulations
