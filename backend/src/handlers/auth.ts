import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { signupSchema, loginSchema } from '../utils/validation';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { sendError, formatZodError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/auth';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export const signup = async (req: Request, res: Response) => {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Validation failed',
        formatZodError(parseResult.error)
      );
    }

    const { name, email, password, role } = parseResult.data;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return sendError(res, 400, 'BAD_REQUEST', 'Email address is already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'USER'
      }
    });

    const token = generateToken({ userId: user.id, role: user.role });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE
    });

    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Signup error:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred during signup');
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Validation failed',
        formatZodError(parseResult.error)
      );
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Invalid email or password');
    }

    const token = generateToken({ userId: user.id, role: user.role });

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE
    });

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred during login');
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  return res.json({ success: true });
};

export const me = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Not authenticated');
  }
  return res.json(req.user);
};
