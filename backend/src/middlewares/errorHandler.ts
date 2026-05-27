import { Request, Response, NextFunction } from 'express';
import { logger } from '@/logger';
import { COMMON_MESSAGES } from '@/messages';
import { ApiError } from '@/utils/ApiError';
import { ApiResponse } from '@/utils/ApiResponse';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${req.method} ${req.url} - ${err.message}`);

  const statusCode = err instanceof ApiError ? err.statusCode : 500;

  res.status(statusCode).json(
    new ApiResponse(statusCode, err.message || COMMON_MESSAGES.INTERNAL_SERVER_ERROR)
  );
};
