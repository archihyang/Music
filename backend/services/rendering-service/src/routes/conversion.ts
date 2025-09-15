import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import multer from 'multer';
import { logger } from '../utils/logger';
import { QueueService } from '../services/queue';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/midi', 'audio/x-midi', 'application/octet-stream'];
    const allowedExtensions = ['.mid', '.midi'];
    
    const hasValidType = allowedTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext => 
      file.originalname.toLowerCase().endsWith(ext)
    );
    
    if (hasValidType || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MIDI files are allowed.'));
    }
  }
});

// MIDI to notation/tab conversion
router.post('/midi-to-notation', upload.single('midiFile'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No MIDI file provided'
      });
    }

    const schema = Joi.object({
      format: Joi.string().valid('notation', 'tab', 'both').default('notation'),
      outputFormat: Joi.string().valid('svg', 'png', 'pdf').default('svg'),
      instrument: Joi.string().valid('guitar', 'piano', 'bass').default('guitar'),
      tuning: Joi.string().when('instrument', {
        is: 'guitar',
        then: Joi.valid('standard', 'drop-d', 'open-g').default('standard'),
        otherwise: Joi.optional()
      }),
      difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const jobId = uuidv4();
    const job = {
      id: jobId,
      type: 'conversion' as const,
      data: {
        midiBuffer: req.file.buffer,
        fileName: req.file.originalname,
        options: {
          format: value.format,
          outputFormat: value.outputFormat,
          instrument: value.instrument,
          tuning: value.tuning,
          difficulty: value.difficulty
        }
      },
      userId: req.headers['user-id'] as string,
      priority: 2
    };

    const queueService = QueueService.getInstance();
    await queueService.addJob(job);

    res.status(202).json({
      success: true,
      jobId,
      status: 'queued',
      message: 'MIDI conversion job queued successfully',
      estimatedTime: '30-60 seconds'
    });

  } catch (error) {
    logger.error('Error in MIDI conversion', error);
    next(error);
  }
});

// Convert between notation formats
router.post('/format-convert', async (req, res, next) => {
  try {
    const schema = Joi.object({
      inputData: Joi.string().required(),
      inputFormat: Joi.string().valid('musicxml', 'abc', 'midi').required(),
      outputFormat: Joi.string().valid('svg', 'png', 'pdf', 'midi').required(),
      options: Joi.object({
        width: Joi.number().min(100).max(2000).default(800),
        height: Joi.number().min(100).max(2000).default(600),
        dpi: Joi.number().min(72).max(300).default(150)
      }).default({})
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const jobId = uuidv4();
    const job = {
      id: jobId,
      type: 'format-conversion' as const,
      data: {
        inputData: value.inputData,
        inputFormat: value.inputFormat,
        outputFormat: value.outputFormat,
        options: value.options
      },
      userId: req.headers['user-id'] as string,
      priority: 1
    };

    const queueService = QueueService.getInstance();
    await queueService.addJob(job);

    res.status(202).json({
      success: true,
      jobId,
      status: 'queued',
      message: 'Format conversion job queued successfully'
    });

  } catch (error) {
    logger.error('Error in format conversion', error);
    next(error);
  }
});

// Optimize notation for printing
router.post('/optimize-print', async (req, res, next) => {
  try {
    const schema = Joi.object({
      notationData: Joi.string().required(),
      pageSize: Joi.string().valid('A4', 'Letter', 'Legal').default('A4'),
      orientation: Joi.string().valid('portrait', 'landscape').default('portrait'),
      margins: Joi.object({
        top: Joi.number().min(0).max(50).default(20),
        bottom: Joi.number().min(0).max(50).default(20),
        left: Joi.number().min(0).max(50).default(15),
        right: Joi.number().min(0).max(50).default(15)
      }).default({}),
      fontSize: Joi.number().min(8).max(24).default(12),
      staffSize: Joi.number().min(0.5).max(2.0).default(1.0)
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const jobId = uuidv4();
    const job = {
      id: jobId,
      type: 'print-optimization' as const,
      data: {
        notationData: value.notationData,
        printOptions: {
          pageSize: value.pageSize,
          orientation: value.orientation,
          margins: value.margins,
          fontSize: value.fontSize,
          staffSize: value.staffSize
        }
      },
      userId: req.headers['user-id'] as string,
      priority: 1
    };

    const queueService = QueueService.getInstance();
    await queueService.addJob(job);

    res.status(202).json({
      success: true,
      jobId,
      status: 'queued',
      message: 'Print optimization job queued successfully'
    });

  } catch (error) {
    logger.error('Error in print optimization', error);
    next(error);
  }
});

// Batch conversion
router.post('/batch-convert', upload.array('files', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      });
    }

    const schema = Joi.object({
      outputFormat: Joi.string().valid('svg', 'png', 'pdf').default('svg'),
      instrument: Joi.string().valid('guitar', 'piano', 'bass').default('guitar')
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const batchId = uuidv4();
    const jobs = [];

    for (const file of req.files as Express.Multer.File[]) {
      const jobId = uuidv4();
      const job = {
        id: jobId,
        type: 'batch-conversion' as const,
        data: {
          batchId,
          midiBuffer: file.buffer,
          fileName: file.originalname,
          options: {
            outputFormat: value.outputFormat,
            instrument: value.instrument
          }
        },
        userId: req.headers['user-id'] as string,
        priority: 0
      };

      jobs.push({ jobId, fileName: file.originalname });
      
      const queueService = QueueService.getInstance();
      await queueService.addJob(job);
    }

    res.status(202).json({
      success: true,
      batchId,
      jobs,
      status: 'queued',
      message: `Batch conversion started for ${jobs.length} files`,
      estimatedTime: `${jobs.length * 30}-${jobs.length * 60} seconds`
    });

  } catch (error) {
    logger.error('Error in batch conversion', error);
    next(error);
  }
});

export default router;