import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { ImageMetadata } from '@droptest/shared';

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
    const ext = path.extname(file.originalname).toLowerCase();
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

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true, filename });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete image', message: error.message });
  }
});

