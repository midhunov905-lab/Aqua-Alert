import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { requireAuth, attachUser, requireRole } from '../middleware/auth.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(here, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const extensionForType = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${extensionForType[file.mimetype] ?? '.img'}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) return cb(new Error('Photo must be a JPG, PNG, or WebP image.'));
    cb(null, true);
  },
});

const TYPES = ['Contamination', 'Water Shortage', 'Infrastructure Damage'];
const STATUSES = ['New', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const fields = `r.id, r.user_id AS userId, u.name AS reporterName, r.title, r.issue_type AS issueType,
  r.description, r.location_text AS locationText, r.latitude, r.longitude, r.photo_path AS photoPath,
  r.status, r.admin_note AS adminNote, r.created_at AS createdAt, r.updated_at AS updatedAt`;
const asPublicReport = (r) => ({
  id: r.id, title: r.title, issueType: r.issueType, locationText: r.locationText,
  latitude: r.latitude, longitude: r.longitude, status: r.status, createdAt: r.createdAt,
});
const asReport = (r) => ({ ...r, photoUrl: r.photoPath ? `/uploads/${path.basename(r.photoPath)}` : null, photoPath: undefined });

function parseAndValidate(body) {
  const title = String(body?.title ?? '').trim();
  const issueType = String(body?.issueType ?? '').trim();
  const description = String(body?.description ?? '').trim();
  const locationText = String(body?.locationText ?? '').trim();
  const latitude = Number(body?.latitude);
  const longitude = Number(body?.longitude);
  const errors = {};
  if (title.length < 5 || title.length > 120) errors.title = 'Title must be between 5 and 120 characters.';
  if (!TYPES.includes(issueType)) errors.issueType = 'Choose a valid issue type.';
  if (description.length < 20 || description.length > 3000) errors.description = 'Description must be between 20 and 3,000 characters.';
  if (locationText.length < 3 || locationText.length > 180) errors.locationText = 'Add a location between 3 and 180 characters.';
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) errors.latitude = 'Choose a valid point on the map.';
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) errors.longitude = 'Choose a valid point on the map.';
  return { data: { title, issueType, description, locationText, latitude, longitude }, errors };
}

function removeUploadedFile(file) {
  if (file?.path) fs.promises.unlink(file.path).catch(() => {});
}
function removePhotoPath(relativePath) {
  if (!relativePath) return;
  const fullPath = path.resolve(uploadDir, path.basename(relativePath));
  if (fullPath.startsWith(`${uploadDir}${path.sep}`)) fs.promises.unlink(fullPath).catch(() => {});
}

export default function reportRoutes(db) {
  const router = Router();
  const joinReports = `SELECT ${fields} FROM reports r JOIN users u ON u.id = r.user_id`;

  router.get('/public/map', (req, res) => {
    const rows = db.prepare(`SELECT ${fields} FROM reports r JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC LIMIT 1500`).all();
    res.json({ reports: rows.map(asPublicReport) });
  });

  router.get('/public/stats', (_req, res) => {
    const row = db.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
      SUM(CASE WHEN status IN ('New', 'Under Review', 'In Progress') THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN issue_type = 'Water Shortage' THEN 1 ELSE 0 END) AS scarcity FROM reports`).get();
    res.json({ stats: { total: row.total ?? 0, resolved: row.resolved ?? 0, active: row.active ?? 0, scarcity: row.scarcity ?? 0 } });
  });

  router.get('/', requireAuth, attachUser(db), (req, res) => {
    const conditions = [];
    const params = [];
    if (req.user.role !== 'admin') { conditions.push('r.user_id = ?'); params.push(req.user.id); }
    if (req.query.status && STATUSES.includes(String(req.query.status))) { conditions.push('r.status = ?'); params.push(String(req.query.status)); }
    if (req.query.issueType && TYPES.includes(String(req.query.issueType))) { conditions.push('r.issue_type = ?'); params.push(String(req.query.issueType)); }
    if (req.query.search) {
      const term = `%${String(req.query.search).trim().slice(0, 100)}%`;
      conditions.push('(r.title LIKE ? OR r.location_text LIKE ? OR r.description LIKE ?)');
      params.push(term, term, term);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const reports = db.prepare(`${joinReports} ${where} ORDER BY r.created_at DESC LIMIT 500`).all(...params);
    res.json({ reports: reports.map(asReport) });
  });

  router.post('/', requireAuth, attachUser(db), requireRole('citizen'), (req, res, next) => {
    upload.single('photo')(req, res, (uploadError) => {
      if (uploadError) return next(uploadError);
      try {
        const { data, errors } = parseAndValidate(req.body);
        if (Object.keys(errors).length) { removeUploadedFile(req.file); return res.status(400).json({ message: 'Please check the report details.', errors }); }
        const result = db.prepare(`INSERT INTO reports
          (user_id, title, issue_type, description, location_text, latitude, longitude, photo_path)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(
            req.user.id, data.title, data.issueType, data.description, data.locationText,
            data.latitude, data.longitude, req.file?.filename ?? null,
          );
        const report = db.prepare(`${joinReports} WHERE r.id = ?`).get(result.lastInsertRowid);
        res.status(201).json({ report: asReport(report), message: 'Your report has been submitted.' });
      } catch (error) { removeUploadedFile(req.file); next(error); }
    });
  });

  router.put('/:id', requireAuth, attachUser(db), (req, res, next) => {
    upload.single('photo')(req, res, (uploadError) => {
      if (uploadError) return next(uploadError);
      try {
        const reportId = Number(req.params.id);
        if (!Number.isSafeInteger(reportId) || reportId <= 0) { removeUploadedFile(req.file); return res.status(400).json({ message: 'Invalid report ID.' }); }
        const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(reportId);
        if (!existing) { removeUploadedFile(req.file); return res.status(404).json({ message: 'Report not found.' }); }
        const isAdmin = req.user.role === 'admin';
        if (!isAdmin && (existing.user_id !== req.user.id || existing.status !== 'New')) {
          removeUploadedFile(req.file);
          return res.status(403).json({ message: 'You can only edit your own new reports.' });
        }

        if (isAdmin && Object.hasOwn(req.body, 'status') && Object.keys(req.body).every((key) => ['status', 'adminNote'].includes(key)) && !req.file) {
          const status = String(req.body.status);
          const adminNote = String(req.body.adminNote ?? '').trim().slice(0, 1000);
          if (!STATUSES.includes(status)) return res.status(400).json({ message: 'Choose a valid status.' });
          db.prepare('UPDATE reports SET status = ?, admin_note = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, adminNote || null, reportId);
        } else {
          const { data, errors } = parseAndValidate(req.body);
          if (Object.keys(errors).length) { removeUploadedFile(req.file); return res.status(400).json({ message: 'Please check the report details.', errors }); }
          const photoPath = req.file?.filename ?? existing.photo_path;
          db.prepare(`UPDATE reports SET title = ?, issue_type = ?, description = ?, location_text = ?, latitude = ?, longitude = ?,
            photo_path = ?, updated_at = datetime('now') WHERE id = ?`).run(
              data.title, data.issueType, data.description, data.locationText, data.latitude, data.longitude, photoPath, reportId,
            );
          if (req.file && existing.photo_path) removePhotoPath(existing.photo_path);
        }
        const report = db.prepare(`${joinReports} WHERE r.id = ?`).get(reportId);
        return res.json({ report: asReport(report), message: 'Report updated successfully.' });
      } catch (error) { removeUploadedFile(req.file); next(error); }
    });
  });

  router.delete('/:id', requireAuth, attachUser(db), (req, res) => {
    const reportId = Number(req.params.id);
    if (!Number.isSafeInteger(reportId) || reportId <= 0) return res.status(400).json({ message: 'Invalid report ID.' });
    const report = db.prepare('SELECT id, user_id, status, photo_path FROM reports WHERE id = ?').get(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    if (req.user.role !== 'admin' && (report.user_id !== req.user.id || report.status !== 'New')) {
      return res.status(403).json({ message: 'You can only delete your own new reports.' });
    }
    db.prepare('DELETE FROM reports WHERE id = ?').run(reportId);
    removePhotoPath(report.photo_path);
    res.json({ message: 'Report deleted successfully.' });
  });

  return router;
}
