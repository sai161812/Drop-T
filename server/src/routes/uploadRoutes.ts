import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { ImageMetadata } from '@droptest/shared';
import { getDatabase } from '../db/database.js';

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

uploadRouter.post('/', upload.single('image'), (req: Request, res: Response) => {
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

    const imageMetadata: ImageMetadata = {
      id: path.parse(req.file.filename).name,
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      size_bytes: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_at: new Date().toISOString()
    };

    res.status(201).json(imageMetadata);
  } catch (error: any) {
    res.status(500).json({ error: 'Image upload failed', message: error.message });
  }
});

uploadRouter.delete('/:filename', (req: Request, res: Response) => {
  try {
    const filename = path.basename(String(req.params.filename));
    const filePath = path.join(config.uploadDir, filename);
    const used = getDatabase().prepare('SELECT 1 FROM options WHERE images LIKE ? LIMIT 1').get(`%/uploads/${filename}%`);
    if (used) return res.status(409).json({ error: 'This image is used by a saved test. Remove it from an editable draft first.' });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true, filename });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete image', message: error.message });
  }
});

uploadRouter.use((error: any, _req: Request, res: Response, _next: any) => {
  res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : 'Upload a JPEG, PNG, GIF or WebP image.' });
});
