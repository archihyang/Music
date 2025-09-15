"""
Tab Renderer Service - VexFlow Integration for Guitar Tab Rendering
Genesis Music - 전문가 수준의 탭 렌더링 시스템

Features:
- VexFlow tab notation generation
- SVG/Canvas export
- Multi-track support
- Chord diagram generation
- Dynamic layout optimization
- Print-ready formatting
- Interactive elements support
"""

import json
import logging
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from pathlib import Path
import asyncio

from .tab_converter import (
    TabMeasure, GuitarNote, PlayingTechnique,
    TabConfiguration, Tuning
)

logger = logging.getLogger(__name__)


@dataclass
class RenderConfiguration:
    """렌더링 설정"""
    # Layout settings
    width: int = 1200
    height: int = 800
    measures_per_line: int = 4
    tab_line_spacing: int = 20
    system_spacing: int = 60
    
    # Style settings
    font_family: str = "Arial, sans-serif"
    font_size: int = 10
    note_color: str = "#000000"
    technique_color: str = "#FF0000"
    chord_diagram_size: int = 60
    
    # Display options
    show_notation: bool = True
    show_tablature: bool = True
    show_chord_diagrams: bool = True
    show_techniques: bool = True
    show_fingering: bool = True
    show_time_signature: bool = True
    show_tempo: bool = True
    
    # Export settings
    format: str = "svg"  # svg, png, pdf
    dpi: int = 300


class VexFlowFormatter:
    """VexFlow 포맷터"""
    
    # Technique symbols in VexFlow
    TECHNIQUE_SYMBOLS = {
        PlayingTechnique.HAMMER_ON: "h",
        PlayingTechnique.PULL_OFF: "p",
        PlayingTechnique.SLIDE_UP: "/",
        PlayingTechnique.SLIDE_DOWN: "\\",
        PlayingTechnique.BEND: "b",
        PlayingTechnique.VIBRATO: "~",
        PlayingTechnique.PALM_MUTE: "P.M.",
        PlayingTechnique.HARMONIC: "H",
        PlayingTechnique.TAP: "T",
        PlayingTechnique.DEAD_NOTE: "X"
    }
    
    # Note duration mappings
    DURATION_MAP = {
        4.0: "w",      # whole note
        2.0: "h",      # half note
        1.0: "q",      # quarter note
        0.5: "8",      # eighth note
        0.25: "16",    # sixteenth note
        0.125: "32",   # thirty-second note
    }
    
    @staticmethod
    def format_tab_note(note: GuitarNote, measure_duration: float) -> Dict:
        """기타 노트를 VexFlow 형식으로 변환"""
        duration = note.end_time - note.start_time
        vexflow_duration = VexFlowFormatter._get_vexflow_duration(duration, measure_duration)
        
        # Basic note object
        vexflow_note = {
            "positions": [{
                "str": 6 - note.string + 1,  # VexFlow uses reverse string numbering
                "fret": note.fret
            }],
            "duration": vexflow_duration
        }
        
        # Add techniques
        if note.techniques:
            modifiers = []
            for tech in note.techniques:
                if tech in VexFlowFormatter.TECHNIQUE_SYMBOLS:
                    modifiers.append({
                        "type": "annotation",
                        "text": VexFlowFormatter.TECHNIQUE_SYMBOLS[tech],
                        "position": "above"
                    })
            vexflow_note["modifiers"] = modifiers
        
        return vexflow_note
    
    @staticmethod
    def _get_vexflow_duration(duration: float, measure_duration: float) -> str:
        """시간을 VexFlow duration으로 변환"""
        # Calculate relative duration
        relative_duration = duration / measure_duration * 4  # Assuming 4/4 time
        
        # Find closest duration
        closest_duration = min(
            VexFlowFormatter.DURATION_MAP.keys(),
            key=lambda x: abs(x - relative_duration)
        )
        
        return VexFlowFormatter.DURATION_MAP[closest_duration]
    
    @staticmethod
    def format_chord_diagram(chord_shape: str, positions: List[Tuple[int, int]]) -> Dict:
        """코드 다이어그램 생성"""
        return {
            "chord": chord_shape,
            "positions": [{"str": s, "fret": f} for s, f in positions],
            "barres": VexFlowFormatter._detect_barres(positions)
        }
    
    @staticmethod
    def _detect_barres(positions: List[Tuple[int, int]]) -> List[Dict]:
        """바레 코드 감지"""
        barres = []
        fret_groups = {}
        
        # Group by fret
        for string, fret in positions:
            if fret > 0:
                if fret not in fret_groups:
                    fret_groups[fret] = []
                fret_groups[fret].append(string)
        
        # Detect barres (3+ strings on same fret)
        for fret, strings in fret_groups.items():
            if len(strings) >= 3:
                barres.append({
                    "from_string": max(strings),
                    "to_string": min(strings),
                    "fret": fret
                })
        
        return barres


class TabRenderer:
    """Tab 렌더링 서비스"""
    
    def __init__(self, config: Optional[RenderConfiguration] = None):
        self.config = config or RenderConfiguration()
        self.formatter = VexFlowFormatter()
    
    def render_tab(self, measures: List[TabMeasure]) -> Dict:
        """탭 렌더링"""
        vexflow_data = {
            "config": asdict(self.config),
            "staves": [],
            "chord_diagrams": [],
            "tempo": measures[0].tempo if measures else 120,
            "time_signature": measures[0].time_signature if measures else [4, 4]
        }
        
        # Group measures into systems
        systems = self._group_into_systems(measures)
        
        for system_idx, system_measures in enumerate(systems):
            system_data = self._render_system(system_measures, system_idx)
            vexflow_data["staves"].extend(system_data["staves"])
            vexflow_data["chord_diagrams"].extend(system_data["chord_diagrams"])
        
        return vexflow_data
    
    def _group_into_systems(self, measures: List[TabMeasure]) -> List[List[TabMeasure]]:
        """마디를 시스템으로 그룹화"""
        systems = []
        current_system = []
        
        for measure in measures:
            current_system.append(measure)
            
            if len(current_system) >= self.config.measures_per_line:
                systems.append(current_system)
                current_system = []
        
        if current_system:
            systems.append(current_system)
        
        return systems
    
    def _render_system(self, measures: List[TabMeasure], system_idx: int) -> Dict:
        """시스템 렌더링"""
        system_data = {
            "staves": [],
            "chord_diagrams": []
        }
        
        y_position = system_idx * (self.config.system_spacing + 100)
        
        for measure_idx, measure in enumerate(measures):
            x_position = measure_idx * (self.config.width // self.config.measures_per_line)
            
            # Create stave
            stave_data = {
                "x": x_position + 10,
                "y": y_position,
                "width": (self.config.width // self.config.measures_per_line) - 20,
                "options": {
                    "num_lines": 6,
                    "spacing_between_lines_px": self.config.tab_line_spacing
                }
            }
            
            # Add clef and time signature to first measure
            if measure_idx == 0 and system_idx == 0:
                stave_data["clef"] = "tab"
                if self.config.show_time_signature:
                    stave_data["time_signature"] = f"{measure.time_signature[0]}/{measure.time_signature[1]}"
                if self.config.show_tempo:
                    stave_data["tempo"] = {
                        "duration": "q",
                        "bpm": int(measure.tempo)
                    }
            
            # Add notes
            stave_data["notes"] = self._render_measure_notes(measure)
            
            # Add chord diagrams
            chord_diagrams = self._extract_chord_diagrams(measure)
            if chord_diagrams and self.config.show_chord_diagrams:
                for diagram in chord_diagrams:
                    diagram["x"] = x_position + 10
                    diagram["y"] = y_position - self.config.chord_diagram_size - 10
                    system_data["chord_diagrams"].append(diagram)
            
            system_data["staves"].append(stave_data)
        
        return system_data
    
    def _render_measure_notes(self, measure: TabMeasure) -> List[Dict]:
        """마디의 노트 렌더링"""
        vexflow_notes = []
        
        # Group simultaneous notes (chords)
        note_groups = self._group_simultaneous_notes(measure.notes)
        
        for group in note_groups:
            if len(group) == 1:
                # Single note
                vexflow_note = self.formatter.format_tab_note(
                    group[0],
                    self._calculate_measure_duration(measure)
                )
                vexflow_notes.append(vexflow_note)
            else:
                # Chord
                positions = []
                for note in group:
                    positions.append({
                        "str": 6 - note.string + 1,
                        "fret": note.fret
                    })
                
                chord_note = {
                    "positions": positions,
                    "duration": self.formatter._get_vexflow_duration(
                        group[0].end_time - group[0].start_time,
                        self._calculate_measure_duration(measure)
                    )
                }
                vexflow_notes.append(chord_note)
        
        return vexflow_notes
    
    def _group_simultaneous_notes(self, notes: List[GuitarNote]) -> List[List[GuitarNote]]:
        """동시 노트 그룹화"""
        if not notes:
            return []
        
        groups = []
        sorted_notes = sorted(notes, key=lambda n: n.start_time)
        current_group = [sorted_notes[0]]
        
        for note in sorted_notes[1:]:
            # Check if note starts at same time (within tolerance)
            if abs(note.start_time - current_group[0].start_time) < 0.01:
                current_group.append(note)
            else:
                groups.append(current_group)
                current_group = [note]
        
        if current_group:
            groups.append(current_group)
        
        return groups
    
    def _calculate_measure_duration(self, measure: TabMeasure) -> float:
        """마디 지속시간 계산"""
        beats_per_measure = measure.time_signature[0]
        beat_duration = 60.0 / measure.tempo
        return beats_per_measure * beat_duration
    
    def _extract_chord_diagrams(self, measure: TabMeasure) -> List[Dict]:
        """마디에서 코드 다이어그램 추출"""
        diagrams = []
        seen_shapes = set()
        
        for note in measure.notes:
            if note.chord_shape and note.chord_shape not in seen_shapes:
                # Get all notes with this chord shape
                chord_notes = [n for n in measure.notes if n.chord_shape == note.chord_shape]
                positions = [(n.string, n.fret) for n in chord_notes]
                
                diagram = self.formatter.format_chord_diagram(note.chord_shape, positions)
                diagrams.append(diagram)
                seen_shapes.add(note.chord_shape)
        
        return diagrams
    
    def export_to_json(self, vexflow_data: Dict, output_path: Path) -> None:
        """VexFlow 데이터를 JSON으로 내보내기"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(vexflow_data, f, indent=2, ensure_ascii=False)
    
    def generate_vexflow_script(self, vexflow_data: Dict) -> str:
        """VexFlow JavaScript 코드 생성"""
        script = f"""
// Generated VexFlow Tab Script
const VF = Vex.Flow;

// Create renderer
const div = document.getElementById("tab-output");
const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
renderer.resize({self.config.width}, {self.config.height});
const context = renderer.getContext();

// Render staves
const staves = {json.dumps(vexflow_data['staves'])};
const chordDiagrams = {json.dumps(vexflow_data['chord_diagrams'])};

staves.forEach((staveData, index) => {{
    // Create stave
    const stave = new VF.TabStave(
        staveData.x,
        staveData.y,
        staveData.width,
        staveData.options
    );
    
    // Add clef and time signature
    if (staveData.clef) {{
        stave.addClef(staveData.clef);
    }}
    if (staveData.time_signature) {{
        stave.addTimeSignature(staveData.time_signature);
    }}
    
    // Draw stave
    stave.setContext(context).draw();
    
    // Create notes
    const notes = staveData.notes.map(noteData => {{
        const tabNote = new VF.TabNote({{
            positions: noteData.positions,
            duration: noteData.duration
        }});
        
        // Add modifiers
        if (noteData.modifiers) {{
            noteData.modifiers.forEach(mod => {{
                if (mod.type === 'annotation') {{
                    tabNote.addModifier(
                        new VF.Annotation(mod.text).setPosition(mod.position)
                    );
                }}
            }});
        }}
        
        return tabNote;
    }});
    
    // Create voice and add notes
    const voice = new VF.Voice({{
        num_beats: {vexflow_data['time_signature'][0]},
        beat_value: {vexflow_data['time_signature'][1]}
    }});
    voice.addTickables(notes);
    
    // Format and draw voice
    new VF.Formatter().joinVoices([voice]).format([voice], staveData.width - 50);
    voice.draw(context, stave);
}});

// Draw chord diagrams
chordDiagrams.forEach(diagram => {{
    // Implementation for chord diagrams
    // This would require additional VexFlow chord diagram code
}});
"""
        return script


# API Integration functions
async def render_tab_from_midi(
    midi_notes: List[Dict],
    tab_config: Optional[TabConfiguration] = None,
    render_config: Optional[RenderConfiguration] = None
) -> Dict:
    """MIDI에서 탭 렌더링"""
    from .tab_converter import TabConverter
    
    # Convert MIDI to Tab
    converter = TabConverter(tab_config)
    tab_measures = converter.convert_midi_to_tab(midi_notes)
    
    # Render Tab
    renderer = TabRenderer(render_config)
    vexflow_data = renderer.render_tab(tab_measures)
    
    return vexflow_data


async def render_tab_to_file(
    vexflow_data: Dict,
    output_path: Path,
    format: str = "json"
) -> None:
    """탭을 파일로 렌더링"""
    renderer = TabRenderer()
    
    if format == "json":
        renderer.export_to_json(vexflow_data, output_path)
    elif format == "js":
        script = renderer.generate_vexflow_script(vexflow_data)
        with open(output_path, 'w') as f:
            f.write(script)
    else:
        raise ValueError(f"Unsupported format: {format}")


# Test code
if __name__ == "__main__":
    import asyncio
    
    async def test_render():
        # Test data
        test_notes = [
            {'pitch': 64, 'start': 0.0, 'end': 0.5, 'velocity': 80},
            {'pitch': 67, 'start': 0.5, 'end': 1.0, 'velocity': 80},
            {'pitch': 60, 'start': 1.0, 'end': 1.5, 'velocity': 80},
        ]
        
        # Render tab
        vexflow_data = await render_tab_from_midi(test_notes)
        
        # Export
        await render_tab_to_file(
            vexflow_data,
            Path("test_tab.json"),
            format="json"
        )
        
        print(f"Tab rendered successfully!")
        print(f"Number of staves: {len(vexflow_data['staves'])}")
    
    asyncio.run(test_render())
