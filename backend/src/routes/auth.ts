import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username or Email is required' });
  }

  const cleanUser = username.trim().toLowerCase();
  let user = Array.from(db.users.values()).find(
    (u) => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser
  );

  // If user not found in memory store, create a dynamic authenticated session
  if (!user) {
    user = {
      id: `usr-${uuidv4().slice(0, 8)}`,
      username: cleanUser,
      email: cleanUser.includes('@') ? cleanUser : `${cleanUser}@citizen.ndma.gov.in`,
      fullName: username.charAt(0).toUpperCase() + username.slice(1),
      role: 'CITIZEN',
      zoneId: 'zone-mh-mum',
      phoneNumber: '+91-98000-00000'
    };
    db.users.set(user.id, user);
  }

  const token = generateToken(user);

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      zoneId: user.zoneId,
      phoneNumber: user.phoneNumber
    }
  });
});

// POST /api/auth/register -> Citizen & Responder Registration
authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, email, password, fullName, role, zoneId, phoneNumber } = req.body;

  if (!fullName) {
    return res.status(400).json({ error: 'Full Name is required for registration' });
  }

  const cleanUsername = (username || fullName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(Math.random() * 1000)).trim().toLowerCase();
  const cleanEmail = (email || `${cleanUsername}@citizen.ndma.gov.in`).trim().toLowerCase();

  // Check if existing
  const existing = Array.from(db.users.values()).find(
    (u) => u.username.toLowerCase() === cleanUsername || (email && u.email.toLowerCase() === cleanEmail)
  );

  if (existing) {
    const token = generateToken(existing);
    return res.json({
      success: true,
      token,
      user: existing,
      message: 'Account already registered. Signed in successfully.'
    });
  }

  const newUser: User = {
    id: `usr-${uuidv4().slice(0, 8)}`,
    username: cleanUsername,
    email: cleanEmail,
    fullName: fullName.trim(),
    role: (role as UserRole) || 'CITIZEN',
    zoneId: zoneId || 'zone-mh-mum',
    phoneNumber: phoneNumber || '+91-98765-43210'
  };

  db.users.set(newUser.id, newUser);
  const token = generateToken(newUser);

  return res.status(201).json({
    success: true,
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

// GET /api/auth/demo-tokens -> Pre-signed JWT tokens for quick role switching
authRouter.get('/demo-tokens', (req: Request, res: Response) => {
  const demoAccounts = Array.from(db.users.values()).map((user) => ({
    role: user.role,
    username: user.username,
    fullName: user.fullName,
    zoneId: user.zoneId,
    phoneNumber: user.phoneNumber,
    token: generateToken(user)
  }));

  return res.json(demoAccounts);
});
