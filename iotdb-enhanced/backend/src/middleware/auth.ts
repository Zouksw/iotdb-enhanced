import { Request, Response, NextFunction } from 'express';
import { prisma, jwtUtils, config, logger } from '../lib';
import { isTokenBlacklisted } from '../services/tokenBlacklist';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      logger.warn(`Blacklisted token used from IP: ${req.ip}`);
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    try {
      const payload = jwtUtils.verifyToken(token);
      req.userId = payload.userId;

      // Fetch full user object with role information
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, name: true, role: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error(`Authentication error: ${error} from IP: ${req.ip}`);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Check blacklist first
        if (await isTokenBlacklisted(token)) {
          // Silently skip auth for optional auth
          next();
          return;
        }

        const payload = jwtUtils.verifyToken(token);
        req.userId = payload.userId;

        // Fetch full user object with role information
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, name: true, role: true },
        });

        if (user) {
          req.user = user;
        }
      } catch {
        // Token invalid, but continue without auth
      }
    }
    next();
  } catch (error) {
    next();
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'User information not found' });
      }

      // Check if user's role is in the allowed roles list
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: roles,
          userRole: req.user.role,
        });
      }

      next();
    } catch (error) {
      logger.error(`Authorization error for user ${req.userId} (${req.user?.role}): ${error}`);
      res.status(500).json({ error: 'Authorization failed' });
    }
  };
};
