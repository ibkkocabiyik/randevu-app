import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface JwtPayload {
  userId: string;
  role: 'user' | 'admin';
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '30d' });
}

export function verifyToken(req: VercelRequest): JwtPayload | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: VercelRequest, res: VercelResponse): JwtPayload | null {
  const user = verifyToken(req);
  if (!user) {
    res.status(401).json({ error: 'Token gerekli' });
    return null;
  }
  return user;
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): JwtPayload | null {
  const user = requireAuth(req, res);
  if (!user) return null;
  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin yetkisi gerekli' });
    return null;
  }
  return user;
}

export function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
