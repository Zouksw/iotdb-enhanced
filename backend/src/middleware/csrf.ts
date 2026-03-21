/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 *
 * Implements CSRF token validation for state-changing operations.
 * Uses double-submit cookie pattern for AJAX requests.
 *
 * For API-first applications with JWT, CSRF protection is still important
 * for cookie-based authentication and additional security layers.
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

// Configuration
const CSRF_CONFIG = {
  // Token length in bytes
  TOKEN_LENGTH: 32,

  // Token TTL in seconds (24 hours)
  TOKEN_TTL: 86400,

  // Header name for CSRF token
  HEADER_NAME: 'x-csrf-token',

  // Cookie name for CSRF token
  COOKIE_NAME: 'csrf_token',

  // Methods that require CSRF protection
  PROTECTED_METHODS: ['POST', 'PUT', 'PATCH', 'DELETE'],

  // Paths that are exempt from CSRF protection
  EXEMPT_PATHS: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/refresh',
    '/health',
    '/api-docs',
  ],
};

// Extend Express Request to include CSRF token
export interface CsrfRequest extends Request {
  csrfToken?: string;
}

/**
 * Generate a secure random CSRF token
 */
function generateToken(): string {
  return crypto.randomBytes(CSRF_CONFIG.TOKEN_LENGTH).toString('hex');
}

/**
 * Generate CSRF token and set it as a cookie
 */
export async function generateCsrfToken(
  userId?: string
): Promise<string> {
  const token = generateToken();

  // Store token in Redis for validation
  if (userId) {
    const key = `csrf:user:${userId}`;
    await (await redis()).setEx(key, CSRF_CONFIG.TOKEN_TTL, token);
  }

  return token;
}

/**
 * Validate CSRF token against stored value
 */
async function validateCsrfToken(
  token: string,
  userId?: string
): Promise<boolean> {
  if (!token) {
    return false;
  }

  // If user is authenticated, validate against their stored token
  if (userId) {
    const key = `csrf:user:${userId}`;
    const storedToken = await (await redis()).get(key);

    if (!storedToken || storedToken !== token) {
      logger.warn(`CSRF token validation failed for user ${userId}`);
      return false;
    }

    return true;
  }

  // For non-authenticated requests, validate token format
  return token.length === CSRF_CONFIG.TOKEN_LENGTH * 2; // hex encoded
}

/**
 * CSRF Protection Middleware
 *
 * Generates CSRF tokens for GET requests and validates tokens for
 * state-changing operations (POST, PUT, PATCH, DELETE).
 */
export function csrfProtection(
  options: {
    exemptPaths?: string[];
    ignoreMethods?: string[];
  } = {}
) {
  const exemptPaths = new Set([
    ...CSRF_CONFIG.EXEMPT_PATHS,
    ...(options.exemptPaths || []),
  ]);

  return async (req: CsrfRequest, res: Response, next: NextFunction) => {
    const path = req.path;
    const method = req.method;

    // Check if path is exempt
    if (exemptPaths.has(path)) {
      return next();
    }

    // Check if method should be ignored
    if (options.ignoreMethods?.includes(method)) {
      return next();
    }

    // For safe methods (GET, HEAD, OPTIONS), generate and set token
    if (!CSRF_CONFIG.PROTECTED_METHODS.includes(method)) {
      const token = await generateCsrfToken(req.userId);
      req.csrfToken = token;

      // Set token in cookie (httpOnly for security)
      res.cookie(CSRF_CONFIG.COOKIE_NAME, token, {
        httpOnly: true,
        secure: req.secure,
        sameSite: 'strict',
        maxAge: CSRF_CONFIG.TOKEN_TTL * 1000,
      });

      // Also expose token in response header for AJAX
      res.setHeader(CSRF_CONFIG.HEADER_NAME, token);

      return next();
    }

    // For state-changing methods, validate CSRF token
    const headerToken = req.headers[CSRF_CONFIG.HEADER_NAME] as string;
    const cookieToken = req.cookies?.[CSRF_CONFIG.COOKIE_NAME];

    // Check token in both header and cookie (double-submit pattern)
    const isValid =
      headerToken &&
      headerToken === cookieToken &&
      await validateCsrfToken(headerToken, req.userId);

    if (!isValid) {
      logger.warn(`CSRF validation failed for ${method} ${path} from IP: ${req.ip}, user: ${req.userId}`);

      return res.status(403).json({
        error: 'CSRF token validation failed',
        message: 'Invalid or missing CSRF token',
      });
    }

    next();
  };
}

/**
 * Middleware to refresh CSRF token
 *
 * Use this endpoint to get a fresh CSRF token without validation
 */
export function refreshCsrfToken(
  req: CsrfRequest,
  res: Response,
  next: NextFunction
) {
  generateCsrfToken(req.userId)
    .then((token) => {
      req.csrfToken = token;

      res.cookie(CSRF_CONFIG.COOKIE_NAME, token, {
        httpOnly: true,
        secure: req.secure,
        sameSite: 'strict',
        maxAge: CSRF_CONFIG.TOKEN_TTL * 1000,
      });

      res.setHeader(CSRF_CONFIG.HEADER_NAME, token);
      res.json({ csrfToken: token });
    })
    .catch((error) => {
      logger.error(`Failed to refresh CSRF token: ${error}`);
      res.status(500).json({ error: 'Failed to generate CSRF token' });
    });
}

/**
 * Revoke CSRF token for a user (e.g., on logout)
 */
export async function revokeCsrfToken(userId: string): Promise<void> {
  const key = `csrf:user:${userId}`;
  await (await redis()).del(key);
}

/**
 * Get CSRF configuration for client-side use
 */
export function getCsrfConfig() {
  return {
    headerName: CSRF_CONFIG.HEADER_NAME,
    cookieName: CSRF_CONFIG.COOKIE_NAME,
  };
}

export default csrfProtection;
