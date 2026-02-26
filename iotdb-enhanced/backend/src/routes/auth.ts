import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { registrationRateLimiter, authRateLimiter } from '../middleware/rateLimiter';
import { validate, validationSchemas } from '../middleware/security';
import { asyncHandler, UnauthorizedError, NotFoundError, BadRequestError, ConflictError } from '../middleware/errorHandler';
import { prisma, jwtUtils, config } from '../lib';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: validationSchemas.email,
  password: validationSchemas.password,
  name: z.string().min(0, 'Name (optional)').max(255).optional(),
});

const loginSchema = z.object({
  email: validationSchemas.email,
  password: z.string().min(1, 'Password is required'),
});

// Helper: Get user ID from token
async function getUserIdFromToken(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const payload = jwtUtils.verifyToken(token);
    return payload.userId;
  } catch {
    return null;
  }
}

// POST /api/auth/register - Register new user
router.post('/register', registrationRateLimiter, validate(registerSchema), asyncHandler(async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email },
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(validatedData.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: validatedData.email,
      passwordHash,
      name: validatedData.name || validatedData.email.split('@')[0],
      role: 'EDITOR',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  // Generate tokens
  const token = jwtUtils.generateToken(user.id);
  const refreshToken = jwtUtils.generateRefreshToken(user.id);

  // Create session
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      expiresAt: new Date(Date.now() + config.session.expiresDays * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  // Log the registration
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      resourceType: 'User',
      resourceId: user.id,
      action: 'CREATE',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true,
    },
  });

  res.status(201).json({
    user,
    token,
    refreshToken,
  });
}));

// POST /api/auth/login - Login user
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: validatedData.email },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);

  if (!isValidPassword) {
    // Log failed login attempt
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        resourceType: 'User',
        resourceId: user.id,
        action: 'LOGIN',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success: false,
        errorCode: 'INVALID_PASSWORD',
      },
    }).catch(() => {});

    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate tokens
  const token = jwtUtils.generateToken(user.id);
  const refreshToken = jwtUtils.generateRefreshToken(user.id);

  // Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      expiresAt: new Date(Date.now() + config.session.expiresDays * 24 * 60 * 60 * 1000),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Log successful login
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      resourceType: 'User',
      resourceId: user.id,
      action: 'LOGIN',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true,
    },
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
    },
    token,
    refreshToken,
    sessionId: session.id,
  });
}));

// POST /api/auth/logout - Logout user
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  const userId = await getUserIdFromToken(req.headers.authorization);

  if (!userId) {
    throw new UnauthorizedError('Invalid token');
  }

  // Invalidate all sessions for this user
  await prisma.session.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });

  // Log logout
  await prisma.auditLog.create({
    data: {
      userId,
      resourceType: 'Session',
      action: 'DELETE',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true,
    },
  }).catch(() => {});

  res.json({ message: 'Logged out successfully' });
}));

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required');
  }

  let userId: string;
  try {
    const payload = jwtUtils.verifyRefreshToken(refreshToken);
    userId = payload.userId;
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Verify session exists and is active
  const sessions = await prisma.session.findMany({
    where: { userId, isActive: true },
  });

  const isValidSession = await Promise.all(
    sessions.map(s => bcrypt.compare(refreshToken, s.tokenHash))
  ).then(results => results.some(r => r));

  if (!isValidSession) {
    throw new UnauthorizedError('Invalid session');
  }

  // Generate new access token
  const newToken = jwtUtils.generateToken(userId);

  res.json({ token: newToken });
}));

// GET /api/auth/me - Get current user
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const userId = await getUserIdFromToken(req.headers.authorization);

  if (!userId) {
    throw new UnauthorizedError('Invalid token');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      preferences: true,
      createdAt: true,
      lastLoginAt: true,
      _count: {
        select: {
          datasets: true,
          models: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  res.json({ user });
}));

// PUT /api/auth/me - Update current user
router.put('/me', asyncHandler(async (req: Request, res: Response) => {
  const userId = await getUserIdFromToken(req.headers.authorization);

  if (!userId) {
    throw new UnauthorizedError('Invalid token');
  }

  const updateSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    avatarUrl: z.string().url().optional(),
    preferences: z.any().optional(),
  });

  const validatedData = updateSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: userId },
    data: validatedData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      preferences: true,
    },
  });

  res.json({ user });
}));

// POST /api/auth/change-password - Change password
router.post('/change-password', asyncHandler(async (req: Request, res: Response) => {
  const userId = await getUserIdFromToken(req.headers.authorization);

  if (!userId) {
    throw new UnauthorizedError('Invalid token');
  }

  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  });

  const validatedData = schema.parse(req.body);

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new NotFoundError('User');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(validatedData.currentPassword, user.passwordHash);

  if (!isValidPassword) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(validatedData.newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Invalidate all sessions
  await prisma.session.updateMany({
    where: { userId },
    data: { isActive: false },
  });

  // Log password change
  await prisma.auditLog.create({
    data: {
      userId,
      resourceType: 'User',
      resourceId: userId,
      action: 'UPDATE',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      success: true,
    },
  });

  res.json({ message: 'Password changed successfully. Please login again.' });
}));

export { router as authRouter };
