import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { COMMON_MESSAGES } from '@/messages';

export const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: COMMON_MESSAGES.VALIDATION_ERROR,
          errors: error.issues.map((err: any) => ({ field: err.path.join('.'), message: err.message })),
        });
      } else {
        next(error);
      }
    }
  };
};
