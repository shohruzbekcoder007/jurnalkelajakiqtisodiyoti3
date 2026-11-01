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

// Sahifa muharriri uchun rasm va hujjatlar (uploads/pages/). Faqat kengaytma bo'yicha ruxsat:
// express.static Content-Type'ni kengaytmadan oladi, shuning uchun HTML/SVG kabi fayllar o'tmaydi
export const PAGE_FILES_DIR = path.join(UPLOAD_DIR, 'pages');
fs.mkdirSync(PAGE_FILES_DIR, { recursive: true });

export const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const PAGE_FILE_EXTS = [...IMAGE_EXTS, '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.odt', '.ods', '.zip'];

export const pageFileUpload = multer({
  storage: multer.diskStorage({
    destination: PAGE_FILES_DIR,
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = PAGE_FILE_EXTS.includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : Object.assign(new Error(`Ruxsat etilgan fayllar: ${PAGE_FILE_EXTS.join(', ')}`), { status: 400 }), ok);
  },
});

// Busboy fayl nomini latin1 deb o'qiydi — kirill/o‘zbekcha nomlar buzilmasligi uchun
export function originalName(file) {
  const utf8 = Buffer.from(file.originalname, 'latin1').toString('utf8');
  return utf8.includes('�') ? file.originalname : utf8;
}

export function removeUpload(filename) {
  if (!filename) return;
  const file = path.join(UPLOAD_DIR, path.basename(filename));
  fs.promises.unlink(file).catch(() => {});
}
