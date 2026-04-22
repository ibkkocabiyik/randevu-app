import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export interface JwtPayload {
  userId: string;
  role: 'user' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token gerekli' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Geçersiz token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin yetkisi gerekli' });
      return;
    }
    next();
  });
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '30d' });
}
