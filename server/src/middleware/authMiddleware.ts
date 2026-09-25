import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '@droptest/shared';
import { AuthRepository } from '../db/authRepository.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionToken?: string;
}

/**
 * Optional authentication middleware: parses session token if provided
 */
export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/session_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
    const user = AuthRepository.getUserBySessionToken(token);
    if (user) {
      req.user = user;
      req.sessionToken = token;
    }
  }

  next();
}

/**
 * Strict authentication middleware: requires an active user session
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
    return;
  }
  next();
}

/**
 * Role-based authorization middleware: requires specific role(s)
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required. Please sign in to continue.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        error: `Access denied. This action requires a ${allowedRoles.join(' or ')} account.` 
      });
      return;
    }
    next();
  };
}
