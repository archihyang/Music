import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  error: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';
  
  logger.error('Error occurred', {
    status,
    message,
    code: error.code,
    path: req.path,
    method: req.method,
    stack: error.stack
  });

  res.status(status).json({
    success: false,
    error: {
      message,
      code: error.code,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};