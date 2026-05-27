import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@/utils/jwt';
import { AUTH_MESSAGES } from '@/messages';
import { ApiError } from '@/utils/ApiError';

export const isAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED_TOKEN_MISSING));
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return next(new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED_INVALID_TOKEN));
  }

  req.user = decoded;
  next();
};

export const hasRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, AUTH_MESSAGES.FORBIDDEN));
    }
    next();
  };
};
