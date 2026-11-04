import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './config.ts';

export interface UserTokenPayload {
  userId: string;
  email: string;
  roleId: string;
  accountType: string;
  status: string;
  fullName: string;
  requiresPasswordChange: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: UserTokenPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as UserTokenPayload;
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token. Please log in again.' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.roleId)) {
      return res.status(403).json({ error: 'Access denied: insufficient administrative permissions.' });
    }
    next();
  };
}

export function requireApproved(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.user.roleId === 'SUPER_ADMIN' || req.user.roleId === 'ADMIN') {
    return next();
  }
  if (req.user.status === 'PENDING') {
    return res.status(403).json({
      error: 'Account Pending Approval',
      code: 'ACCOUNT_PENDING_APPROVAL',
      message: 'Your registration is currently being verified by an administrator. You will receive an email once approved.'
    });
  }
  if (req.user.status === 'SUSPENDED') {
    return res.status(403).json({
      error: 'Account Suspended',
      code: 'ACCOUNT_SUSPENDED',
      message: 'Your account has been temporarily suspended by an administrator.'
    });
  }
  if (req.user.status === 'REJECTED') {
    return res.status(403).json({
      error: 'Account Rejected',
      code: 'ACCOUNT_REJECTED',
      message: 'Your account registration was not approved.'
    });
  }
  next();
}
