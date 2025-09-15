import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import { z } from 'zod';

// Import routes
import transcriptionRoutes from './api/transcription/routes.js';
import analysisRoutes from './api/analysis/routes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { validateRequest } from './middleware/validation.js';
import { authenticate } from './middleware/auth.js';

// Load environment variables
dotenv.config();

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'genesis-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Initialize Express app with type safety
const app = express();
const httpServer = createServer(app);

// Configure CORS origins
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

// Initialize Socket.IO with typed events
interface ServerToClientEvents {
  'progress:update': (data: { jobId: string; progress: number; message?: string }) => void;
  'job:complete': (data: { jobId: string; result: any }) => void;
  'job:error': (data: { jobId: string; error: string }) => void;
}

interface ClientToServerEvents {
  'subscribe:job': (jobId: string) => void;
  'unsubscribe:job': (jobId: string) => void;
  'transcription:start': (data: { url?: string; file?: string }) => void;
  'analysis:request': (data: { jobId: string; type: string }) => void;
}

const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const transcriptionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 transcriptions per hour
  message: 'Transcription rate limit exceeded. Please try again later.',
  skipFailedRequests: true,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-Id', req.id);
  next();
});

// Static files with cache control
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// API Routes with rate limiting
app.use('/api/transcribe', transcriptionLimiter, transcriptionRoutes);
app.use('/api/analysis', limiter, analysisRoutes);

// Health check endpoint with detailed status
const HealthCheckSchema = z.object({
  detailed: z.boolean().optional()
});

app.get('/health', (req: Request, res: Response) => {
  const { detailed } = HealthCheckSchema.parse(req.query);
  
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    services: {
      api: 'running',
      websocket: {
        status: io.engine.clientsCount > 0 ? 'connected' : 'waiting',
        clients: io.engine.clientsCount
      },
      database: 'connected', // TODO: Add actual DB health check
    }
  };

  if (detailed) {
    Object.assign(healthStatus, {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    });
  }

  res.json(healthStatus);
});

// WebSocket handling with namespaces and rooms
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id} from ${socket.handshake.address}`);
  
  // Join job-specific rooms
  socket.on('subscribe:job', (jobId: string) => {
    if (!jobId || typeof jobId !== 'string') {
      socket.emit('job:error', { 
        jobId: '', 
        error: 'Invalid job ID' 
      });
      return;
    }
    
    socket.join(`job:${jobId}`);
    logger.info(`Socket ${socket.id} subscribed to job ${jobId}`);
  });
  
  socket.on('unsubscribe:job', (jobId: string) => {
    socket.leave(`job:${jobId}`);
    logger.info(`Socket ${socket.id} unsubscribed from job ${jobId}`);
  });
  
  socket.on('transcription:start', async (data) => {
    try {
      logger.info(`Starting transcription for socket ${socket.id}`, data);
      // TODO: Implement transcription logic with job queue
      
      // Example progress updates
      const jobId = `job_${Date.now()}`;
      socket.emit('progress:update', { 
        jobId, 
        progress: 0, 
        message: 'Transcription started' 
      });
      
    } catch (error) {
      logger.error('Transcription error:', error);
      socket.emit('job:error', { 
        jobId: '', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  socket.on('analysis:request', async (data) => {
    try {
      logger.info(`Analysis requested by socket ${socket.id}`, data);
      // TODO: Implement analysis logic
    } catch (error) {
      logger.error('Analysis error:', error);
      socket.emit('job:error', { 
        jobId: data.jobId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  socket.on('disconnect', (reason) => {
    logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
  });
  
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.id || 'unknown';
  
  logger.error({
    requestId,
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
      requestId,
      ...(isDev && { 
        stack: err.stack,
        details: err.details 
      })
    }
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: {
      message: 'Resource not found',
      code: 'NOT_FOUND',
      path: req.path,
      method: req.method
    }
  });
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing connections...');
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
    
    io.close(() => {
      logger.info('WebSocket server closed');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  logger.info(`🚀 Server running on http://${HOST}:${PORT}`);
  logger.info(`📡 WebSocket server ready`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 CORS origins: ${corsOrigins.join(', ')}`);
});

// Export for testing
export { app, io, logger };

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id?: string;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}