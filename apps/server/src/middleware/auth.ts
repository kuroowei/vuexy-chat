import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string };
    }
  }
}

// Kept as an alias so existing imports of `AuthRequest` elsewhere
// (e.g. routes/calls.ts) don't need to change.
export type AuthRequest = Request;

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallbacksecret') as any;
    req.user = { userId: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};