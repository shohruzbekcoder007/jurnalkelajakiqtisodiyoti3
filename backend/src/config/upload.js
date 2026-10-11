import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';

// backend/ papkasi — yo'l jarayon qayerdan ishga tushirilganiga bog'liq bo'lmasligi uchun
const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(BACKEND_ROOT, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const pdfUpload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.pdf`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf';
    cb(ok ? null : Object.assign(new Error('Faqat PDF fayl yuklash mumkin'), { status: 400 }), ok);
  },
});

export function removeUpload(filename) {
  if (!filename) return;
  const file = path.join(UPLOAD_DIR, path.basename(filename));
  fs.promises.unlink(file).catch(() => {});
}
