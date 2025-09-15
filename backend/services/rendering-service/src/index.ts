import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import notationRoutes from './routes/notation';
import conversionRoutes from './routes/conversion';
import analysisRoutes from './routes/analysis';
import healthRoutes from './routes/health';
import { RedisClient } from './services/redis';
import { QueueService } from './services/queue';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/notation', notationRoutes);
app.use('/api/conversion', conversionRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/health', healthRoutes);

// WebSocket handling
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('subscribe', (jobId: string) => {
    socket.join(`job:${jobId}`);
    logger.info('Client subscribed to job', { socketId: socket.id, jobId });
  });

  socket.on('unsubscribe', (jobId: string) => {
    socket.leave(`job:${jobId}`);
    logger.info('Client unsubscribed from job', { socketId: socket.id, jobId });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Error handling
app.use(errorHandler);

// Initialize services
async function initializeServices() {
  try {
    // Connect to Redis
    await RedisClient.getInstance().connect();
    logger.info('Redis connected');

    // Initialize queue service
    const queueService = QueueService.getInstance();
    await queueService.initialize();
    logger.info('Queue service initialized');

    // Start server
    server.listen(PORT, () => {
      logger.info(`Rendering service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to initialize services', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await RedisClient.getInstance().disconnect();
    await QueueService.getInstance().close();
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    await RedisClient.getInstance().disconnect();
    await QueueService.getInstance().close();
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Export for testing
export { app, io };

// Start the service
initializeServices();