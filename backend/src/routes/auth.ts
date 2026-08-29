import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/memoryStore';
import { User, UserRole } from '../types';
import { JWT_SECRET, AuthUserPayload } from '../middleware/auth';

export const authRouter = Router();

// Helper to sign JWT
export const generateToken = (user: User): string => {
  const payload: AuthUserPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    zoneId: user.zoneId,
    fullName: user.fullName
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = Array.from(db.users.values()).find(
    (u) => u.username === username || u.email === username
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Demo accounts check or bcrypt compare
  const token = generateToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      zoneId: user.zoneId
    }
  });
});

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, email, password, fullName, role, zoneId, phoneNumber } = req.body;

  if (!username || !email || !password || !fullName) {
    return res.status(400).json({ error: 'Username, email, password, and fullName are required' });
  }

  const existing = Array.from(db.users.values()).find(
    (u) => u.username === username || u.email === email
  );
  if (existing) {
    return res.status(400).json({ error: 'Username or email already exists' });
  }

  const newUser: User = {
    id: `usr-${uuidv4().slice(0, 8)}`,
    username,
    email,
    fullName,
    role: (role as UserRole) || 'CITIZEN',
    zoneId: zoneId || 'zone-city-1',
    phoneNumber
  };

  db.users.set(newUser.id, newUser);
  const token = generateToken(newUser);

  return res.status(201).json({
    token,
    user: newUser
  });
});

// GET /api/auth/me
authRouter.get('/me', (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = db.users.get(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json(user);
});

// GET /api/auth/demo-tokens -> Pre-signed JWT tokens for quick role switching & automated tests
authRouter.get('/demo-tokens', (req: Request, res: Response) => {
  const demoAccounts = Array.from(db.users.values()).map((user) => ({
    role: user.role,
    username: user.username,
    fullName: user.fullName,
    zoneId: user.zoneId,
    token: generateToken(user)
  }));

  return res.json(demoAccounts);
});
