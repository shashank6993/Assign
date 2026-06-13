import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/errors';
import prisma from '../utils/prisma';
import { Role } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    name: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Authentication token missing or invalid');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid or expired token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'User not found');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    return next();
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred');
  }
};

export const authorize = (roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'User not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'FORBIDDEN', 'Access denied');
    }

    return next();
  };
};
