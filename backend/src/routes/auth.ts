import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/memoryStore';
import { User, UserRole } from '../types';
import { JWT_SECRET, AuthUserPayload } from '../middleware/auth';

export const authRouter = Router();

// In-memory passwords store for registered citizens & admin
const userPasswords: Map<string, string> = new Map([
  ['fardeenakmal123@gmail.com', 'Akmal@1974'],
  ['fardeenakmal', 'Akmal@1974']
]);

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
    return res.status(400).json({ error: 'Email or Username is required' });
  }

  const cleanIdentifier = username.trim().toLowerCase();

  // 1. Check Fixed Admin Account (Fardeen Akmal)
  if (cleanIdentifier === 'fardeenakmal123@gmail.com' || cleanIdentifier === 'fardeenakmal') {
    if (password !== 'Akmal@1974') {
      return res.status(401).json({ error: 'Invalid password for Administrator account' });
    }

    const adminUser: User = {
      id: 'usr-admin-fardeen',
      username: 'fardeenakmal',
      email: 'fardeenakmal123@gmail.com',
      fullName: 'Fardeen Akmal',
      role: 'NATIONAL_COMMANDER',
      zoneId: 'zone-ndma-in',
      phoneNumber: '+91-98765-43210'
    };
    db.users.set(adminUser.id, adminUser);

    const token = generateToken(adminUser);
    return res.json({
      success: true,
      token,
      user: adminUser,
      isAdmin: true
    });
  }

  // 2. Check Registered Citizen Account
  const existingUser = Array.from(db.users.values()).find(
    (u) => u.username.toLowerCase() === cleanIdentifier || u.email.toLowerCase() === cleanIdentifier
  );

  if (!existingUser) {
    return res.status(401).json({
      error: 'Account not found. Please register as a Citizen or check your credentials.'
    });
  }

  const storedPassword = userPasswords.get(cleanIdentifier) || userPasswords.get(existingUser.email.toLowerCase()) || userPasswords.get(existingUser.username.toLowerCase());
  if (storedPassword && password && storedPassword !== password) {
    return res.status(401).json({ error: 'Invalid password. Please try again.' });
  }

  const token = generateToken(existingUser);
  return res.json({
    success: true,
    token,
    user: existingUser,
    isAdmin: existingUser.role === 'NATIONAL_COMMANDER' || existingUser.role === 'CONTROL_ROOM_OPERATOR'
  });
});

// POST /api/auth/register -> Citizen Registration
authRouter.post('/register', async (req: Request, res: Response) => {
  const { username, email, password, fullName, zoneId, phoneNumber } = req.body;

  if (!fullName) {
    return res.status(400).json({ error: 'Full Name is required for registration' });
  }

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanUsername = (username || fullName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(100 + Math.random() * 900)).trim().toLowerCase();

  // Prevent duplicate registration of admin email
  if (cleanEmail === 'fardeenakmal123@gmail.com' || cleanUsername === 'fardeenakmal') {
    return res.status(400).json({ error: 'This email is reserved for system administration. Please sign in.' });
  }

  // Check if existing user
  const existing = Array.from(db.users.values()).find(
    (u) => (cleanEmail && u.email.toLowerCase() === cleanEmail) || u.username.toLowerCase() === cleanUsername
  );

  if (existing) {
    return res.status(400).json({ error: 'An account with this email or username already exists. Please sign in.' });
  }

  const newUser: User = {
    id: `usr-cit-${uuidv4().slice(0, 8)}`,
    username: cleanUsername,
    email: cleanEmail || `${cleanUsername}@citizen.aegisops.in`,
    fullName: fullName.trim(),
    role: 'CITIZEN',
    zoneId: zoneId || 'zone-mh-mum',
    phoneNumber: phoneNumber || '+91-98000-00000'
  };

  db.users.set(newUser.id, newUser);
  if (password) {
    userPasswords.set(cleanUsername, password);
    if (cleanEmail) userPasswords.set(cleanEmail, password);
  }

  const token = generateToken(newUser);

  return res.status(201).json({
    success: true,
    token,
    user: newUser,
    message: 'Citizen registered successfully.'
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
