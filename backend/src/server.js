import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import { connectDB } from './config/db.js';
import { UPLOAD_DIR } from './config/upload.js';
import articlesRouter from './routes/articles.js';
import rubricsRouter from './routes/rubrics.js';
import issuesRouter from './routes/issues.js';
import pagesRouter from './routes/pages.js';
import submissionsRouter from './routes/submissions.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';

if (!process.env.JWT_SECRET) {
  console.error('.env faylida JWT_SECRET ko‘rsatilmagan');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true }));
app.use(express.json({ limit: '2mb' }));

// Yuklangan PDF fayllar
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/articles', articlesRouter);
app.use('/api/rubrics', rubricsRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

app.use('/api', (req, res) => res.status(404).json({ message: 'Topilmadi' }));

// Production: tayyor frontend (npm run build) shu serverdan beriladi
const CLIENT_DIR = path.resolve(
  process.env.CLIENT_DIR ||
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'frontend', 'dist')
);
if (fs.existsSync(path.join(CLIENT_DIR, 'index.html'))) {
  app.use(express.static(CLIENT_DIR, { index: false, maxAge: '7d' }));
  // SPA: barcha qolgan manzillar index.html ga yo'naltiriladi
  app.get('*', (req, res) => res.sendFile(path.join(CLIENT_DIR, 'index.html')));
  console.log(`Frontend: ${CLIENT_DIR}`);
} else {
  console.log('Frontend build topilmadi — faqat API ishlaydi (frontend/: npm run build)');
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    return res.status(400).json({ message: 'Maydonlarni to‘g‘ri to‘ldiring', errors });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Noto‘g‘ri qiymat: ${err.path}` });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Bunday yozuv allaqachon mavjud' });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Fayl hajmi 20 MB dan oshmasligi kerak' : err.message;
    return res.status(400).json({ message });
  }
  if (err.status) return res.status(err.status).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Server xatosi' });
});

connectDB(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`API: http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('MongoDB ulanishida xato:', err.message);
    process.exit(1);
  });
