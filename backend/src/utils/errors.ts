import { Response } from 'express';
import { ZodError } from 'zod';

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details: ApiErrorDetail[] = []
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details: ApiErrorDetail[] = []
) => {
  return res.status(statusCode).json({
    error: {
      code,
      message,
      details
    }
  });
};

export const formatZodError = (error: ZodError): ApiErrorDetail[] => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};
