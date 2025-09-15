/**
 * VexFlow Rendering Engine
 * Server-side music notation rendering with VexFlow
 */

const { JSDOM } = require('jsdom');
const { createCanvas } = require('canvas');
const Vex = require('vexflow');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const sharp = require('sharp');

// VexFlow components
const { Renderer, Stave, StaveNote, Voice, Formatter, TabStave, TabNote, Beam, Accidental, Modifier } = Vex.Flow;

class VexFlowRenderingEngine {
    constructor(options = {}) {
        this.options = {
            staveWidth: 400,
            staveSpacing: 150,
            measuresPerLine: 4,
            pageWidth: 2480,  // A4 at 300 DPI
            pageHeight: 3508, // A4 at 300 DPI
            margin: 100,
            fontSize: 14,
            tabEnabled: true,
            notationEnabled: true,
            ...options
        };
        
        this.noteMapping = this.initializeNoteMapping();
        this.tabMapping = this.initializeTabMapping();
    }
    
    /**
     * Initialize note name to VexFlow mapping
     */
    initializeNoteMapping() {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const mapping = {};
        
        for (let octave = 0; octave <= 8; octave++) {
            notes.forEach((note, index) => {
                const midiNumber = octave * 12 + index;
                mapping[midiNumber] = `${note.toLowerCase().replace('#', '#')}/${octave}`;
            });
        }
        
        return mapping;
    }
    
    /**
     * Initialize guitar tab position mapping
     */
    initializeTabMapping() {
        // Standard guitar tuning: E2, A2, D3, G3, B3, E4
        const openStrings = [40, 45, 50, 55, 59, 64]; // MIDI numbers
        
        return {
            openStrings,
            maxFret: 24,
            strings: 6
        };
    }
    
    /**
     * Render MIDI to notation and tabs
     */
    async renderMidiToNotation(midiData, options = {}) {
        const renderOptions = { ...this.options, ...options };
        
        try {
            // Parse MIDI data
            const parsedMidi = this.parseMidiData(midiData);
            
            // Create rendering context
            const { context, renderer } = this.createRenderingContext(renderOptions);
            
            // Render measures
            const renderedPages = this.renderMeasures(
                context,
                parsedMidi,
                renderOptions
            );
            
            // Generate output formats
            const outputs = {
                svg: await this.generateSVG(renderedPages),
                png: await this.generatePNG(renderedPages, renderOptions),
                pdf: await this.generatePDF(renderedPages, renderOptions)
            };
            
            return {
                success: true,
                outputs,
                metadata: {
                    measures: parsedMidi.measures.length,
                    pages: renderedPages.length,
                    duration: parsedMidi.duration
                }
            };
            
        } catch (error) {
            console.error('VexFlow rendering error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Parse MIDI data into internal format
     */
    parseMidiData(midiData) {
        // This would parse actual MIDI file
        // For now, returning mock structure
        return {
            timeSignature: '4/4',
            keySignature: 'C',
            tempo: 120,
            measures: this.generateMockMeasures(),
            duration: 180 // seconds
        };
    }
    
    /**
     * Generate mock measures for testing
     */
    generateMockMeasures() {
        const measures = [];
        
        // Generate 16 measures of sample music
        for (let i = 0; i < 16; i++) {
            const notes = [];
            
            // Generate random notes for this measure
            const noteCount = Math.floor(Math.random() * 4) + 4; // 4-8 notes
            
            for (let j = 0; j < noteCount; j++) {
                const midiNote = 40 + Math.floor(Math.random() * 24); // E2 to E4
                notes.push({
                    midi: midiNote,
                    duration: ['8', 'q', 'h'][Math.floor(Math.random() * 3)],
                    velocity: 80
                });
            }
            
            measures.push({
                number: i + 1,
                notes
            });
        }
        
        return measures;
    }
    
    /**
     * Create rendering context (Canvas or SVG)
     */
    createRenderingContext(options) {
        // Create canvas for rendering
        const canvas = createCanvas(options.pageWidth, options.pageHeight);
        const renderer = new Renderer(canvas, Renderer.Backends.CANVAS);
        const context = renderer.getContext();
        
        context.setFont('Arial', options.fontSize);
        
        return { context, renderer, canvas };
    }
    
    /**
     * Render measures to pages
     */
    renderMeasures(context, parsedMidi, options) {
        const pages = [];
        let currentPage = { staves: [], tabs: [] };
        let x = options.margin;
        let y = options.margin;
        let measureCount = 0;
        
        parsedMidi.measures.forEach((measure, idx) => {
            // Start new line if needed
            if (measureCount % options.measuresPerLine === 0 && measureCount > 0) {
                x = options.margin;
                y += options.staveSpacing;
                
                // Start new page if needed
                if (y > options.pageHeight - options.staveSpacing * 2) {
                    pages.push(currentPage);
                    currentPage = { staves: [], tabs: [] };
                    y = options.margin;
                }
            }
            
            // Render standard notation
            if (options.notationEnabled) {
                const stave = this.renderStave(
                    context,
                    x,
                    y,
                    options.staveWidth,
                    measure,
                    idx === 0
                );
                currentPage.staves.push(stave);
            }
            
            // Render tab notation
            if (options.tabEnabled) {
                const tabY = options.notationEnabled ? y + 100 : y;
                const tab = this.renderTabStave(
                    context,
                    x,
                    tabY,
                    options.staveWidth,
                    measure,
                    idx === 0
                );
                currentPage.tabs.push(tab);
            }
            
            x += options.staveWidth;
            measureCount++;
        });
        
        // Add last page
        if (currentPage.staves.length > 0 || currentPage.tabs.length > 0) {
            pages.push(currentPage);
        }
        
        return pages;
    }
    
    /**
     * Render a single stave (standard notation)
     */
    renderStave(context, x, y, width, measure, isFirst) {
        const stave = new Stave(x, y, width);
        
        // Add clef, key, and time signature to first measure
        if (isFirst) {
            stave.addClef('treble');
            stave.addTimeSignature('4/4');
            stave.addKeySignature('C');
        }
        
        stave.setContext(context).draw();
        
        // Create notes
        const staveNotes = measure.notes.map(note => {
            const pitch = this.midiToPitch(note.midi);
            const staveNote = new StaveNote({
                keys: [pitch],
                duration: note.duration
            });
            
            // Add accidentals if needed
            if (pitch.includes('#')) {
                staveNote.addModifier(new Accidental('#'), 0);
            } else if (pitch.includes('b')) {
                staveNote.addModifier(new Accidental('b'), 0);
            }
            
            return staveNote;
        });
        
        // Create voice and format
        if (staveNotes.length > 0) {
            const voice = new Voice({ num_beats: 4, beat_value: 4 });
            voice.addTickables(staveNotes);
            
            new Formatter().joinVoices([voice]).format([voice], width - 50);
            voice.draw(context, stave);
            
            // Add beams for eighth notes
            const beams = Beam.generateBeams(staveNotes);
            beams.forEach(beam => beam.setContext(context).draw());
        }
        
        return { x, y, width, measure: measure.number };
    }
    
    /**
     * Render a tab stave
     */
    renderTabStave(context, x, y, width, measure, isFirst) {
        const tabStave = new TabStave(x, y, width);
        
        // Add TAB clef to first measure
        if (isFirst) {
            tabStave.addClef('tab');
        }
        
        tabStave.setContext(context).draw();
        
        // Create tab notes
        const tabNotes = measure.notes.map(note => {
            const { string, fret } = this.midiToTab(note.midi);
            
            return new TabNote({
                positions: [{ str: string, fret }],
                duration: note.duration
            });
        });
        
        // Create voice and format
        if (tabNotes.length > 0) {
            const voice = new Voice({ num_beats: 4, beat_value: 4 });
            voice.addTickables(tabNotes);
            
            new Formatter().joinVoices([voice]).format([voice], width - 50);
            voice.draw(context, tabStave);
        }
        
        return { x, y, width, measure: measure.number };
    }
    
    /**
     * Convert MIDI note to pitch notation
     */
    midiToPitch(midiNumber) {
        return this.noteMapping[midiNumber] || 'c/4';
    }
    
    /**
     * Convert MIDI note to tab position
     */
    midiToTab(midiNumber) {
        const { openStrings, maxFret } = this.tabMapping;
        
        // Find best string and fret combination
        for (let stringNum = 6; stringNum >= 1; stringNum--) {
            const openNote = openStrings[6 - stringNum];
            const fret = midiNumber - openNote;
            
            if (fret >= 0 && fret <= maxFret) {
                return { string: stringNum, fret };
            }
        }
        
        // Default to first string
        return { string: 1, fret: 0 };
    }
    
    /**
     * Generate SVG output
     */
    async generateSVG(pages) {
        const svgPages = [];
        
        for (const page of pages) {
            // Create SVG context
            const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
            const document = dom.window.document;
            const svgContainer = document.createElement('div');
            
            const renderer = new Renderer(svgContainer, Renderer.Backends.SVG);
            const context = renderer.getContext();
            
            // Re-render page to SVG
            // ... (render logic)
            
            svgPages.push(svgContainer.innerHTML);
        }
        
        return svgPages;
    }
    
    /**
     * Generate PNG output
     */
    async generatePNG(pages, options) {
        const pngBuffers = [];
        
        for (const page of pages) {
            // Canvas is already rendered, get buffer
            const { canvas } = this.createRenderingContext(options);
            
            // Re-render page to canvas
            // ... (render logic)
            
            const buffer = canvas.toBuffer('image/png');
            pngBuffers.push(buffer);
        }
        
        return pngBuffers;
    }
    
    /**
     * Generate PDF output
     */
    async generatePDF(pages, options) {
        const pdfDoc = await PDFDocument.create();
        
        for (const pageData of pages) {
            // Create PDF page
            const page = pdfDoc.addPage([
                options.pageWidth * 0.24, // Convert to PDF points (72 DPI)
                options.pageHeight * 0.24
            ]);
            
            // Render notation to PDF
            // This would involve converting canvas/SVG to PDF format
            // For now, we'll add text as placeholder
            
            const { width, height } = page.getSize();
            const fontSize = 30;
            
            page.drawText('Music Notation Page', {
                x: 50,
                y: height - 50,
                size: fontSize,
                color: rgb(0, 0, 0)
            });
        }
        
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    }
    
    /**
     * Render guitar chord diagrams
     */
    renderChordDiagram(chordName, fingering) {
        // Create chord diagram using VexFlow
        const canvas = createCanvas(200, 250);
        const renderer = new Renderer(canvas, Renderer.Backends.CANVAS);
        const context = renderer.getContext();
        
        // Draw chord diagram
        const x = 10;
        const y = 10;
        const width = 180;
        const height = 200;
        
        // Draw fretboard
        context.fillStyle = '#000';
        
        // Vertical lines (strings)
        for (let i = 0; i < 6; i++) {
            const stringX = x + (width / 5) * i;
            context.beginPath();
            context.moveTo(stringX, y);
            context.lineTo(stringX, y + height);
            context.stroke();
        }
        
        // Horizontal lines (frets)
        for (let i = 0; i < 5; i++) {
            const fretY = y + (height / 4) * i;
            context.beginPath();
            context.moveTo(x, fretY);
            context.lineTo(x + width, fretY);
            context.stroke();
        }
        
        // Draw fingering positions
        fingering.forEach((fret, string) => {
            if (fret > 0) {
                const stringX = x + (width / 5) * string;
                const fretY = y + (height / 4) * (fret - 0.5);
                
                context.beginPath();
                context.arc(stringX, fretY, 8, 0, 2 * Math.PI);
                context.fillStyle = '#000';
                context.fill();
            } else if (fret === 0) {
                // Open string
                const stringX = x + (width / 5) * string;
                context.beginPath();
                context.arc(stringX, y - 10, 5, 0, 2 * Math.PI);
                context.strokeStyle = '#000';
                context.stroke();
            } else {
                // Muted string
                const stringX = x + (width / 5) * string;
                context.font = '20px Arial';
                context.fillText('X', stringX - 7, y - 5);
            }
        });
        
        // Add chord name
        context.font = 'bold 24px Arial';
        context.fillText(chordName, x + width / 2 - 20, y + height + 30);
        
        return canvas.toBuffer('image/png');
    }
    
    /**
     * Analyze and optimize notation layout
     */
    optimizeLayout(measures, options) {
        // Calculate optimal measures per line
        const avgNotesPerMeasure = measures.reduce((sum, m) => sum + m.notes.length, 0) / measures.length;
        const optimalMeasuresPerLine = Math.max(2, Math.min(6, Math.floor(16 / avgNotesPerMeasure)));
        
        // Calculate spacing
        const availableWidth = options.pageWidth - (options.margin * 2);
        const staveWidth = Math.floor(availableWidth / optimalMeasuresPerLine);
        
        return {
            measuresPerLine: optimalMeasuresPerLine,
            staveWidth,
            staveSpacing: options.tabEnabled ? 200 : 150
        };
    }
}

module.exports = VexFlowRenderingEngine;