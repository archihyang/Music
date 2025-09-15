/**
 * Rendering Controller
 * Handles notation rendering requests
 */

const VexFlowRenderingEngine = require('../engines/vexflow-engine');
const { uploadToStorage } = require('../utils/storage');
const { validateMidiFile, validateRenderOptions } = require('../utils/validators');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;

class RenderingController {
    constructor() {
        this.renderingEngine = new VexFlowRenderingEngine();
        this.renderCache = new Map();
    }
    
    /**
     * Render MIDI to notation
     */
    async renderMidiToNotation(req, res) {
        try {
            const { midiData, options = {} } = req.body;
            
            if (!midiData) {
                return res.status(400).json({
                    success: false,
                    error: 'MIDI data is required'
                });
            }
            
            // Validate options
            const validatedOptions = validateRenderOptions(options);
            
            // Check cache
            const cacheKey = this.generateCacheKey(midiData, validatedOptions);
            if (this.renderCache.has(cacheKey)) {
                logger.info('Returning cached render result');
                return res.json(this.renderCache.get(cacheKey));
            }
            
            // Render notation
            logger.info('Starting VexFlow rendering');
            const result = await this.renderingEngine.renderMidiToNotation(
                midiData,
                validatedOptions
            );
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error || 'Rendering failed'
                });
            }
            
            // Store rendered files
            const urls = await this.storeRenderedFiles(result.outputs);
            
            // Prepare response
            const response = {
                success: true,
                urls,
                metadata: result.metadata,
                options: validatedOptions
            };
            
            // Cache result
            this.renderCache.set(cacheKey, response);
            
            // Clean old cache entries
            if (this.renderCache.size > 100) {
                const firstKey = this.renderCache.keys().next().value;
                this.renderCache.delete(firstKey);
            }
            
            return res.json(response);
            
        } catch (error) {
            logger.error('Rendering error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Render tab notation only
     */
    async renderTabs(req, res) {
        try {
            const { midiData, tuning = 'standard' } = req.body;
            
            if (!midiData) {
                return res.status(400).json({
                    success: false,
                    error: 'MIDI data is required'
                });
            }
            
            // Render with tabs only
            const options = {
                tabEnabled: true,
                notationEnabled: false,
                tuning
            };
            
            const result = await this.renderingEngine.renderMidiToNotation(
                midiData,
                options
            );
            
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    error: result.error || 'Tab rendering failed'
                });
            }
            
            // Store and return URLs
            const urls = await this.storeRenderedFiles(result.outputs);
            
            return res.json({
                success: true,
                urls,
                metadata: result.metadata
            });
            
        } catch (error) {
            logger.error('Tab rendering error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Render chord diagram
     */
    async renderChordDiagram(req, res) {
        try {
            const { chordName, fingering } = req.body;
            
            if (!chordName || !fingering) {
                return res.status(400).json({
                    success: false,
                    error: 'Chord name and fingering are required'
                });
            }
            
            // Validate fingering array
            if (!Array.isArray(fingering) || fingering.length !== 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Fingering must be an array of 6 values'
                });
            }
            
            // Render chord diagram
            const diagramBuffer = this.renderingEngine.renderChordDiagram(
                chordName,
                fingering
            );
            
            // Store and return URL
            const filename = `chord_${chordName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
            const url = await uploadToStorage(diagramBuffer, filename, 'image/png');
            
            return res.json({
                success: true,
                url,
                chord: chordName,
                fingering
            });
            
        } catch (error) {
            logger.error('Chord diagram error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Convert notation to PDF
     */
    async convertToPDF(req, res) {
        try {
            const { notationUrl, options = {} } = req.body;
            
            if (!notationUrl) {
                return res.status(400).json({
                    success: false,
                    error: 'Notation URL is required'
                });
            }
            
            // Download notation file
            // ... (download logic)
            
            // Convert to PDF
            const pdfOptions = {
                pageSize: options.pageSize || 'A4',
                orientation: options.orientation || 'portrait',
                margin: options.margin || 20
            };
            
            // Generate PDF
            const pdfBuffer = await this.renderingEngine.generatePDF(
                [], // Pages would come from notation
                pdfOptions
            );
            
            // Store and return URL
            const filename = `notation_${Date.now()}.pdf`;
            const url = await uploadToStorage(pdfBuffer, filename, 'application/pdf');
            
            return res.json({
                success: true,
                url,
                format: 'pdf',
                options: pdfOptions
            });
            
        } catch (error) {
            logger.error('PDF conversion error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Get available chord library
     */
    async getChordLibrary(req, res) {
        try {
            const chords = [
                { name: 'C', fingering: [3, 3, 2, 0, 1, 0], type: 'major' },
                { name: 'G', fingering: [3, 2, 0, 0, 3, 3], type: 'major' },
                { name: 'Am', fingering: [0, 0, 2, 2, 1, 0], type: 'minor' },
                { name: 'F', fingering: [1, 3, 3, 2, 1, 1], type: 'major', barre: 1 },
                { name: 'D', fingering: [-1, -1, 0, 2, 3, 2], type: 'major' },
                { name: 'Em', fingering: [0, 2, 2, 0, 0, 0], type: 'minor' },
                { name: 'E', fingering: [0, 2, 2, 1, 0, 0], type: 'major' },
                { name: 'A', fingering: [0, 0, 2, 2, 2, 0], type: 'major' },
                { name: 'Dm', fingering: [-1, -1, 0, 2, 3, 1], type: 'minor' },
                { name: 'B7', fingering: [-1, 2, 1, 2, 0, 2], type: 'dominant7' }
            ];
            
            return res.json({
                success: true,
                chords,
                total: chords.length
            });
            
        } catch (error) {
            logger.error('Chord library error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Get rendering options and capabilities
     */
    async getCapabilities(req, res) {
        try {
            const capabilities = {
                formats: ['svg', 'png', 'pdf'],
                notationTypes: ['standard', 'tab', 'combined'],
                pageSizes: ['A4', 'Letter', 'Legal', 'Custom'],
                tunings: [
                    { name: 'Standard', notes: ['E', 'A', 'D', 'G', 'B', 'E'] },
                    { name: 'Drop D', notes: ['D', 'A', 'D', 'G', 'B', 'E'] },
                    { name: 'Open G', notes: ['D', 'G', 'D', 'G', 'B', 'D'] },
                    { name: 'DADGAD', notes: ['D', 'A', 'D', 'G', 'A', 'D'] }
                ],
                maxPages: 100,
                maxMeasuresPerPage: 32,
                supportedTimeSignatures: ['2/4', '3/4', '4/4', '6/8', '12/8'],
                supportedKeys: [
                    'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#',
                    'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb',
                    'Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m',
                    'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm', 'Abm'
                ]
            };
            
            return res.json({
                success: true,
                capabilities
            });
            
        } catch (error) {
            logger.error('Capabilities error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Batch render multiple files
     */
    async batchRender(req, res) {
        try {
            const { files, options = {} } = req.body;
            
            if (!Array.isArray(files) || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Files array is required'
                });
            }
            
            if (files.length > 10) {
                return res.status(400).json({
                    success: false,
                    error: 'Maximum 10 files allowed per batch'
                });
            }
            
            const results = [];
            
            for (const file of files) {
                try {
                    const result = await this.renderingEngine.renderMidiToNotation(
                        file.midiData,
                        { ...options, ...file.options }
                    );
                    
                    if (result.success) {
                        const urls = await this.storeRenderedFiles(result.outputs);
                        results.push({
                            id: file.id,
                            success: true,
                            urls,
                            metadata: result.metadata
                        });
                    } else {
                        results.push({
                            id: file.id,
                            success: false,
                            error: result.error
                        });
                    }
                } catch (error) {
                    results.push({
                        id: file.id,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            return res.json({
                success: true,
                results,
                total: files.length,
                successful: results.filter(r => r.success).length
            });
            
        } catch (error) {
            logger.error('Batch rendering error:', error);
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    /**
     * Generate cache key
     */
    generateCacheKey(midiData, options) {
        const crypto = require('crypto');
        const hash = crypto.createHash('md5');
        hash.update(JSON.stringify({ midiData, options }));
        return hash.digest('hex');
    }
    
    /**
     * Store rendered files to storage
     */
    async storeRenderedFiles(outputs) {
        const urls = {};
        
        if (outputs.svg) {
            const svgFilename = `notation_${Date.now()}.svg`;
            urls.svg = await uploadToStorage(
                Buffer.from(outputs.svg[0]),
                svgFilename,
                'image/svg+xml'
            );
        }
        
        if (outputs.png) {
            const pngFilename = `notation_${Date.now()}.png`;
            urls.png = await uploadToStorage(
                outputs.png[0],
                pngFilename,
                'image/png'
            );
        }
        
        if (outputs.pdf) {
            const pdfFilename = `notation_${Date.now()}.pdf`;
            urls.pdf = await uploadToStorage(
                outputs.pdf,
                pdfFilename,
                'application/pdf'
            );
        }
        
        return urls;
    }
}

module.exports = new RenderingController();