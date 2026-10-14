import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { clearSessionCookie, createSessionCookie, requireAuth, attachUser } from '../middleware/auth.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please try again in 15 minutes.' },
});

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.created_at ?? user.createdAt });

export default function authRoutes(db) {
  router.post('/register', authLimiter, async (req, res, next) => {
    try {
      const name = String(req.body?.name ?? '').trim();
      const email = String(req.body?.email ?? '').trim().toLowerCase();
      const password = String(req.body?.password ?? '');
      if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return res.status(400).json({ message: 'Enter a valid email address.' });
      if (password.length < 8 || password.length > 72) return res.status(400).json({ message: 'Password must be at least 8 characters long.' });

      const passwordHash = await bcrypt.hash(password, 12);
      let result;
      try {
        result = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(name, email, passwordHash, 'citizen');
      } catch (error) {
        if (String(error.code).includes('SQLITE_CONSTRAINT_UNIQUE')) return res.status(409).json({ message: 'An account with this email already exists.' });
        throw error;
      }
      const user = db.prepare('SELECT id, name, email, role, created_at AS createdAt FROM users WHERE id = ?').get(result.lastInsertRowid);
      createSessionCookie(res, user.id);
      return res.status(201).json({ user });
    } catch (error) { next(error); }
  });

  router.post('/login', authLimiter, async (req, res, next) => {
    try {
      const email = String(req.body?.email ?? '').trim().toLowerCase();
      const password = String(req.body?.password ?? '');
      if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
      if (!valid) return res.status(401).json({ message: 'Email or password is incorrect.' });
      createSessionCookie(res, user.id);
      return res.json({ user: publicUser(user) });
    } catch (error) { next(error); }
  });

  router.post('/logout', (req, res) => {
    clearSessionCookie(res);
    res.json({ message: 'Signed out successfully.' });
  });

  router.get('/me', requireAuth, attachUser(db), (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}
