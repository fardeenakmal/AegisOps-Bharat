import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'aegisops-super-secure-production-jwt-key-2026';

export interface AuthUserPayload {
  userId: string;
  username: string;
  role: UserRole;
  zoneId?: string;
  fullName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      requestId?: string;
    }
  }
}

// 1. Request Correlation ID & Audit Middleware
export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const reqId = (req.headers['x-request-id'] as string) || `req-${uuidv4().slice(0, 8)}`;
  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
};

// 2. JWT Verification Middleware
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired JWT authorization token' });
    }
  }

  // Allow anonymous access if route does not strictly require auth, otherwise handler can check req.user
  next();
};

// 3. Role-Based Access Control (RBAC) Guard
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required for this operation' });
    }

    if (!allowedRoles.includes(req.user.role) && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({
        error: `Access forbidden: Role '${req.user.role}' is not authorized. Requires one of: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
};

// 4. Rate Limiting on Public Citizen Reporting Endpoints
export const citizenReportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 submissions per minute during disaster spikes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many submissions from this IP address. Anti-spam throttle active. Please wait 60 seconds.'
  }
});
