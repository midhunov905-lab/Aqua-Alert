import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import db from './db.js';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const here = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(here, '../uploads');
const clientDist = path.resolve(here, '../../client/dist');
fs.mkdirSync(uploadDir, { recursive: true });

const suppliedJwtSecret = String(process.env.JWT_SECRET || '').trim();
const unsafeJwtSecret = suppliedJwtSecret.length < 32 || /change-this|example|development-only/i.test(suppliedJwtSecret);
if (process.env.NODE_ENV === 'production' && unsafeJwtSecret) {
  console.error('Production startup blocked: set JWT_SECRET to a unique, random value of at least 32 characters.');
  process.exit(1);
}
process.env.JWT_SECRET = suppliedJwtSecret || 'local-development-only-secret-change-before-deployment-2026';

if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'AquaAlert@123')) {
  console.error('Production startup blocked: configure a unique ADMIN_EMAIL and ADMIN_PASSWORD.');
  process.exit(1);
}

app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org'],
      connectSrc: ["'self'", 'https://*.tile.openstreetmap.org'],
      fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
}));
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://127.0.0.1:5173').split(',').map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use('/uploads', express.static(uploadDir, { fallthrough: false, maxAge: '1h', immutable: false }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'AquaAlert API' }));
app.use('/api/auth', authRoutes(db));
app.use('/api/reports', reportRoutes(db));

app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found.' }));

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => res.json({ service: 'AquaAlert API', message: 'Start the client with npm run dev at http://127.0.0.1:5173.' }));
}

app.use((err, _req, res, _next) => {
  if (err?.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Photo must be 5 MB or smaller.' : 'The uploaded photo could not be processed.';
    return res.status(400).json({ message });
  }
  if (err?.message?.startsWith('Photo must be')) return res.status(400).json({ message: err.message });
  if (err?.code === 'SQLITE_CONSTRAINT_CHECK') return res.status(400).json({ message: 'Some report details are invalid.' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
});

async function seedAdmin() {
  const email = String(process.env.ADMIN_EMAIL || 'admin@aquaalert.local').trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || 'AquaAlert@123');
  const name = String(process.env.ADMIN_NAME || 'AquaAlert Administrator').trim();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!existing) {
    if (password.length < 8 || password.length > 72) throw new Error('ADMIN_PASSWORD must be between 8 and 72 characters.');
    const hash = await bcrypt.hash(password, 12);
    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(name, email, hash, 'admin');
    console.log(`Created initial administrator account: ${email}`);
  }
}

seedAdmin().then(() => {
  app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
    console.log(`AquaAlert API running at http://127.0.0.1:${PORT}`);
  });
}).catch((error) => {
  console.error('Unable to initialize AquaAlert:', error);
  process.exit(1);
});
