import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import articlesRouter from './routes/articles.js';
import rubricsRouter from './routes/rubrics.js';
import issuesRouter from './routes/issues.js';
import pagesRouter from './routes/pages.js';
import submissionsRouter from './routes/submissions.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/articles', articlesRouter);
app.use('/api/rubrics', rubricsRouter);
app.use('/api/issues', issuesRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/submissions', submissionsRouter);

app.use('/api', (req, res) => res.status(404).json({ message: 'Topilmadi' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    return res.status(400).json({ message: 'Maydonlarni to‘g‘ri to‘ldiring', errors });
  }
  console.error(err);
  res.status(500).json({ message: 'Server xatosi' });
});

connectDB(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`API: http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('MongoDB ulanishida xato:', err.message);
    process.exit(1);
  });
