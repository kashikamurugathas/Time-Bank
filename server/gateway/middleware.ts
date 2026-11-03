import { Request, Response, NextFunction } from 'express';
import { authService, UserTokenPayload } from '../services/auth.service.ts';

export interface AuthenticatedRequest extends Request {
  user?: UserTokenPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Invalid or expired session token. Please log in again.' });
  }

  req.user = payload;
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.roleId)) {
      return res.status(403).json({ error: 'Access denied: Insufficient privileges.' });
    }

    next();
  };
}

export function requireApproved(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.status !== 'APPROVED') {
    return res.status(403).json({
      error: `Your account is currently ${req.user.status.toLowerCase()}. Access to this resource is restricted.`
    });
  }

  next();
}
