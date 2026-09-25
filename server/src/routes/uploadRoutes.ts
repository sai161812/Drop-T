import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { ImageMetadata } from '@droptest/shared';
import { getDatabase } from '../db/database.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/authMiddleware.js';

export const uploadRouter = Router();

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = ({ 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' } as Record<string, string>)[file.mimetype] || '.bin';
    const id = uuidv4();
    cb(null, `${id}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF images are accepted.'));
    }
  }
});

uploadRouter.post('/', requireAuth, upload.single('image'), (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const bytes = fs.readFileSync(req.file.path);
    const type = req.file.mimetype;
    const valid = (type === 'image/png' && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) ||
      (type === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) ||
      (type === 'image/gif' && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6))) ||
      (type === 'image/webp' && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP');
    if (!valid) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'File contents do not match a supported image type.' });
    }

    const uploadedAt = new Date().toISOString();
    const imageMetadata: ImageMetadata = {
      id: path.parse(req.file.filename).name,
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      size_bytes: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_at: uploadedAt
    };

    getDatabase().prepare(`
      INSERT INTO uploads (id, owner_id, server_filename, original_filename, mime_type, size_bytes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      imageMetadata.id,
      req.user!.id,
      req.file.filename,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      uploadedAt
    );

    res.status(201).json(imageMetadata);
  } catch (error: any) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Image upload failed', message: error.message });
  }
});

uploadRouter.delete('/:filename', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestedFilename = String(req.params.filename);
    const filename = path.basename(requestedFilename);
    if (filename !== requestedFilename) return res.status(400).json({ error: 'Invalid upload filename' });

    const db = getDatabase();
    const uploadRow = db.prepare('SELECT owner_id FROM uploads WHERE server_filename = ?').get(filename) as { owner_id: string } | undefined;
    if (!uploadRow) return res.status(403).json({ error: 'This upload has no verified owner and cannot be deleted through the public API.' });
    if (uploadRow.owner_id !== req.user!.id) return res.status(403).json({ error: 'Only the upload owner can delete this image.' });

    const urlPattern = `%/uploads/${filename}%`;
    const usedByOption = db.prepare('SELECT 1 FROM options WHERE images LIKE ? LIMIT 1').get(urlPattern);
    const usedByProduct = db.prepare('SELECT 1 FROM products WHERE images LIKE ? LIMIT 1').get(urlPattern);
    const usedByRun = db.prepare('SELECT 1 FROM runs WHERE snapshot LIKE ? LIMIT 1').get(urlPattern);
    if (usedByOption || usedByProduct || usedByRun) {
      return res.status(409).json({ error: 'This image is still referenced by a product, lab draft, or historical run.' });
    }

    const resolvedUploadDir = path.resolve(config.uploadDir);
    const filePath = path.resolve(resolvedUploadDir, filename);
    if (path.dirname(filePath) !== resolvedUploadDir) return res.status(400).json({ error: 'Invalid upload path' });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    db.prepare('DELETE FROM uploads WHERE server_filename = ? AND owner_id = ?').run(filename, req.user!.id);
    res.json({ success: true, filename });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete image', message: error.message });
  }
});

uploadRouter.use((error: any, _req: Request, res: Response, _next: any) => {
  res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : 'Upload a JPEG, PNG, GIF or WebP image.' });
});
