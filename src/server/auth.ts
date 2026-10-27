import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '../types/index.ts';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured in .env and contain at least 32 characters.');
  }
  return secret;
}
const JWT_EXPIRES_IN = '7d';

export interface AuthPayload {
  id: string;
  email: string;
  name?: string;
  role: Role;
  studentId?: string;
  teacherId?: string;
  staffId?: string;
  scholarNo?: string;
}

// Augment Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

/**
 * Hash plain password using bcrypt (10 rounds)
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

/**
 * Verify plain password against hashed password
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  // Support both bcrypt hashes and fallback initial development seeds
  if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$')) {
    return plainText === hash;
  }
  return bcrypt.compare(plainText, hash);
}

/**
 * Generate signed JWT token
 */
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Express Middleware: Authenticate JWT Bearer Token
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Also check query param token if provided (e.g. for download/print URLs)
  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    // If no token is provided, proceed as anonymous (endpoints with requireAuth will block)
    return next();
  }

  const payload = verifyToken(token);
  if (payload) {
    req.user = payload;
  }
  next();
}

/**
 * Express Middleware: Require Authenticated User
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid Bearer token.',
    });
  }
  next();
}

/**
 * Express Middleware: Enforce Role-Based Access Control (RBAC)
 */
export function requireRole(allowedRoles: (Role | 'PRINCIPAL' | 'STAFF' | 'TEACHER' | 'STUDENT')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in to access this resource.',
      });
    }

    const normalizedAllowed = allowedRoles.map((r) => {
      const lower = r.toLowerCase();
      return lower === 'principal' ? 'admin' : lower;
    });

    const userRole = req.user.role.toLowerCase();

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Insufficient permissions. Role '${req.user.role}' is not authorized. Allowed roles: [${allowedRoles.join(', ')}]`,
      });
    }

    next();
  };
}
