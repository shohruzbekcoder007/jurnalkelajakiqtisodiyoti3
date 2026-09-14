import { Router } from 'express';
import mongoose from 'mongoose';
import Article from '../models/Article.js';
import Rubric from '../models/Rubric.js';
import Issue from '../models/Issue.js';
import Page from '../models/Page.js';
import Submission from '../models/Submission.js';
import { requireAdmin } from '../middleware/auth.js';
import { asyncHandler, issueTitle } from '../utils/asyncHandler.js';
import { uniqueSlug } from '../utils/slugify.js';
import { pdfUpload, removeUpload, UPLOAD_DIR } from '../config/upload.js';
import { buildIssuePdf } from '../utils/buildIssuePdf.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const router = Router();
router.use(requireAdmin);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const toList = (v) =>
  Array.isArray(v)
    ? v.map((s) => String(s).trim()).filter(Boolean)
    : String(v || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
const toParagraphs = (v) =>
  Array.isArray(v)
    ? v.map((s) => String(s).trim()).filter(Boolean)
    : String(v || '')
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean);

function notFound(res, what = 'Yozuv') {
  return res.status(404).json({ message: `${what} topilmadi` });
}

function validId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
  next();
}

/* ---------------- Statistika ---------------- */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [articles, rubrics, issues, pages, submissions, newSubmissions, recentSubmissions] = await Promise.all([
      Article.countDocuments(),
      Rubric.countDocuments(),
      Issue.countDocuments(),
      Page.countDocuments(),
      Submission.countDocuments(),
      Submission.countDocuments({ status: 'new' }),
      Submission.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    res.json({ articles, rubrics, issues, pages, submissions, newSubmissions, recentSubmissions });
  })
);

/* ---------------- Maqolalar ---------------- */
function articlePayload(body) {
  const data = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.summary !== undefined) data.summary = String(body.summary).trim();
  if (body.authors !== undefined) data.authors = toList(body.authors);
  if (body.keywords !== undefined) data.keywords = toList(body.keywords);
  if (body.body !== undefined) data.body = toParagraphs(body.body);
  if (body.rubric !== undefined) data.rubric = body.rubric || undefined;
  if (body.issue !== undefined) data.issue = body.issue || undefined;
  if (body.publishedAt !== undefined) data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : undefined;
  return data;
}

router.get(
  '/articles',
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = {};
    if (req.query.rubric && mongoose.isValidObjectId(req.query.rubric)) filter.rubric = req.query.rubric;
    if (req.query.issue && mongoose.isValidObjectId(req.query.issue)) filter.issue = req.query.issue;
    const q = String(req.query.q || '').trim();
    if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };

    const [items, total] = await Promise.all([
      Article.find(filter)
        .select('-body')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('rubric', 'name')
        .populate('issue', 'year number')
        .lean(),
      Article.countDocuments(filter),
    ]);
    items.forEach((a) => a.issue && (a.issue.title = issueTitle(a.issue)));
    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  })
);

// Tanlash ro'yxatlari uchun barcha maqolalarning qisqa ma'lumoti
router.get(
  '/articles/options',
  asyncHandler(async (req, res) => {
    const items = await Article.find()
      .select('title publishedAt featuredOrder rubric')
      .sort({ publishedAt: -1 })
      .populate('rubric', 'name')
      .lean();
    res.json(items);
  })
);

/* ---------------- Tanlangan maqolalar ---------------- */
// GET /api/admin/featured — [1-o'rin, 2-o'rin, 3-o'rin] (bo'sh o'rin — null)
router.get(
  '/featured',
  asyncHandler(async (req, res) => {
    const items = await Article.find({ featuredOrder: { $gte: 1 } })
      .select('title slug publishedAt featuredOrder rubric')
      .populate('rubric', 'name')
      .lean();
    res.json([1, 2, 3].map((n) => items.find((a) => a.featuredOrder === n) || null));
  })
);

// PUT /api/admin/featured  { articles: [id | null, id | null, id | null] }
router.put(
  '/featured',
  asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body?.articles) ? req.body.articles.slice(0, 3) : null;
    if (!ids) return res.status(400).json({ message: 'articles massivi yuborilmagan' });

    const chosen = ids.map((id) => (id ? String(id) : null));
    const filled = chosen.filter(Boolean);
    if (filled.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: 'Noto‘g‘ri maqola identifikatori' });
    }
    if (new Set(filled).size !== filled.length) {
      return res.status(400).json({ message: 'Bitta maqolani ikki o‘ringa qo‘yib bo‘lmaydi' });
    }
    if ((await Article.countDocuments({ _id: { $in: filled } })) !== filled.length) {
      return res.status(400).json({ message: 'Tanlangan maqolalardan biri topilmadi' });
    }

    await Article.updateMany({ featuredOrder: { $ne: null } }, { $set: { featuredOrder: null } });
    await Promise.all(
      chosen.map((id, i) => (id ? Article.updateOne({ _id: id }, { $set: { featuredOrder: i + 1 } }) : null))
    );
    res.json({ message: 'Tanlangan maqolalar saqlandi' });
  })
);

router.get(
  '/articles/:id',
  validId,
  asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id).lean();
    if (!article) return notFound(res, 'Maqola');
    res.json(article);
  })
);

// Maqolani faqat ochiq songa biriktirish mumkin
async function checkIssueOpen(issueId) {
  if (!issueId) return 'Jurnal sonini tanlang';
  if (!mongoose.isValidObjectId(issueId)) return 'Noto‘g‘ri jurnal soni';
  const issue = await Issue.findById(issueId).lean();
  if (!issue) return 'Jurnal soni topilmadi';
  if (issue.isOpen === false) return `${issueTitle(issue)} yopilgan — unga maqola biriktirib bo‘lmaydi`;
  return null;
}

router.post(
  '/articles',
  asyncHandler(async (req, res) => {
    const data = articlePayload(req.body || {});
    const issueError = await checkIssueOpen(data.issue);
    if (issueError) return res.status(400).json({ message: issueError, errors: { issue: issueError } });
    data.slug = await uniqueSlug(Article, req.body.slug || data.title);
    const article = await Article.create(data);
    res.status(201).json(article);
  })
);

router.put(
  '/articles/:id',
  validId,
  asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) return notFound(res, 'Maqola');
    const data = articlePayload(req.body || {});
    // Boshqa songa o'tkazilayotgan bo'lsa, yangi son ochiq bo'lishi kerak
    if ('issue' in data && String(data.issue || '') !== String(article.issue)) {
      const issueError = await checkIssueOpen(data.issue);
      if (issueError) return res.status(400).json({ message: issueError, errors: { issue: issueError } });
    }
    article.set(data);
    if (req.body.slug !== undefined && req.body.slug !== article.slug) {
      article.slug = await uniqueSlug(Article, req.body.slug || article.title, article._id);
    }
    await article.save();
    res.json(article);
  })
);

router.delete(
  '/articles/:id',
  validId,
  asyncHandler(async (req, res) => {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return notFound(res, 'Maqola');
    removeUpload(article.pdf?.filename);
    res.json({ message: 'Maqola o‘chirildi' });
  })
);

router.post(
  '/articles/:id/pdf',
  validId,
  pdfUpload.single('pdf'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'PDF fayl tanlanmagan' });
    const article = await Article.findById(req.params.id);
    if (!article) {
      removeUpload(req.file.filename);
      return notFound(res, 'Maqola');
    }
    removeUpload(article.pdf?.filename);
    article.pdf = { filename: req.file.filename, originalName: req.file.originalname, size: req.file.size };
    await article.save();
    res.json(article);
  })
);

router.delete(
  '/articles/:id/pdf',
  validId,
  asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id);
    if (!article) return notFound(res, 'Maqola');
    removeUpload(article.pdf?.filename);
    article.pdf = undefined;
    await article.save();
    res.json(article);
  })
);

/* ---------------- Ruknlar ---------------- */
router.get(
  '/rubrics',
  asyncHandler(async (req, res) => {
    const [rubrics, counts] = await Promise.all([
      Rubric.find().sort({ order: 1, name: 1 }).lean(),
      Article.aggregate([{ $group: { _id: '$rubric', count: { $sum: 1 } } }]),
    ]);
    const byId = new Map(counts.map((c) => [String(c._id), c.count]));
    res.json(rubrics.map((r) => ({ ...r, articleCount: byId.get(String(r._id)) || 0 })));
  })
);

router.post(
  '/rubrics',
  asyncHandler(async (req, res) => {
    const { name, order } = req.body || {};
    const rubric = await Rubric.create({
      name,
      order: Number(order) || (await Rubric.countDocuments()) + 1,
      slug: await uniqueSlug(Rubric, req.body.slug || name),
    });
    res.status(201).json(rubric);
  })
);

router.put(
  '/rubrics/:id',
  validId,
  asyncHandler(async (req, res) => {
    const rubric = await Rubric.findById(req.params.id);
    if (!rubric) return notFound(res, 'Rukn');
    const { name, order, slug } = req.body || {};
    if (name !== undefined) rubric.name = name;
    if (order !== undefined) rubric.order = Number(order) || 0;
    if (slug !== undefined && slug !== rubric.slug) rubric.slug = await uniqueSlug(Rubric, slug || rubric.name, rubric._id);
    await rubric.save();
    res.json(rubric);
  })
);

router.delete(
  '/rubrics/:id',
  validId,
  asyncHandler(async (req, res) => {
    const count = await Article.countDocuments({ rubric: req.params.id });
    if (count) return res.status(400).json({ message: `Bu ruknda ${count} ta maqola bor. Avval ularni boshqa ruknga o‘tkazing` });
    const rubric = await Rubric.findByIdAndDelete(req.params.id);
    if (!rubric) return notFound(res, 'Rukn');
    res.json({ message: 'Rukn o‘chirildi' });
  })
);

/* ---------------- Jurnal sonlari ---------------- */
async function countsByIssue() {
  const counts = await Article.aggregate([{ $group: { _id: '$issue', count: { $sum: 1 } } }]);
  return new Map(counts.map((c) => [String(c._id), c.count]));
}

router.get(
  '/issues',
  asyncHandler(async (req, res) => {
    const [issues, counts] = await Promise.all([Issue.find().sort({ year: -1, number: -1 }).lean(), countsByIssue()]);
    res.json(
      issues.map((i) => ({ ...i, isOpen: i.isOpen !== false, title: issueTitle(i), articleCount: counts.get(String(i._id)) || 0 }))
    );
  })
);

router.get(
  '/issues/:id',
  validId,
  asyncHandler(async (req, res) => {
    const issue = await Issue.findById(req.params.id).lean();
    if (!issue) return notFound(res, 'Son');
    const articles = await Article.find({ issue: issue._id })
      .select('title slug publishedAt authors pdf rubric')
      .sort({ publishedAt: 1, _id: 1 })
      .populate('rubric', 'name')
      .lean();
    res.json({ ...issue, isOpen: issue.isOpen !== false, title: issueTitle(issue), articleCount: articles.length, articles });
  })
);

async function applyCurrent(issue) {
  if (issue.isCurrent) await Issue.updateMany({ _id: { $ne: issue._id } }, { isCurrent: false });
}

function issuePayload(body) {
  const data = {};
  if (body.year !== undefined) data.year = Number(body.year);
  if (body.number !== undefined) data.number = Number(body.number);
  if (body.isCurrent !== undefined) data.isCurrent = !!body.isCurrent;
  if (body.isOpen !== undefined) data.isOpen = !!body.isOpen;
  if (body.publishedAt !== undefined) data.publishedAt = body.publishedAt ? new Date(body.publishedAt) : undefined;
  return data;
}

router.post(
  '/issues',
  asyncHandler(async (req, res) => {
    const issue = await Issue.create({ isOpen: true, ...issuePayload(req.body || {}) });
    await applyCurrent(issue);
    res.status(201).json(issue);
  })
);

router.put(
  '/issues/:id',
  validId,
  asyncHandler(async (req, res) => {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return notFound(res, 'Son');
    issue.set(issuePayload(req.body || {}));
    await issue.save();
    await applyCurrent(issue);
    res.json(issue);
  })
);

router.delete(
  '/issues/:id',
  validId,
  asyncHandler(async (req, res) => {
    const count = await Article.countDocuments({ issue: req.params.id });
    if (count) return res.status(400).json({ message: `Bu sonda ${count} ta maqola bor. Avval ularni boshqa songa o‘tkazing` });
    const issue = await Issue.findByIdAndDelete(req.params.id);
    if (!issue) return notFound(res, 'Son');
    removeUpload(issue.pdf?.filename);
    res.json({ message: 'Son o‘chirildi' });
  })
);

// Sonning to'liq PDF kitobini qo'lda yuklash
router.post(
  '/issues/:id/pdf',
  validId,
  pdfUpload.single('pdf'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'PDF fayl tanlanmagan' });
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      removeUpload(req.file.filename);
      return notFound(res, 'Son');
    }
    removeUpload(issue.pdf?.filename);
    issue.pdf = { filename: req.file.filename, originalName: req.file.originalname, size: req.file.size, generated: false };
    await issue.save();
    res.json(issue);
  })
);

router.delete(
  '/issues/:id/pdf',
  validId,
  asyncHandler(async (req, res) => {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return notFound(res, 'Son');
    removeUpload(issue.pdf?.filename);
    issue.pdf = undefined;
    await issue.save();
    res.json(issue);
  })
);

// Sondagi barcha maqolalardan PDF kitob yig'ish
router.post(
  '/issues/:id/pdf/generate',
  validId,
  asyncHandler(async (req, res) => {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return notFound(res, 'Son');
    const articles = await Article.find({ issue: issue._id }).sort({ publishedAt: 1, _id: 1 }).populate('rubric', 'name').lean();
    if (!articles.length) return res.status(400).json({ message: 'Bu sonda hali maqola yo‘q' });

    const { bytes, pages, warnings } = await buildIssuePdf(issue, articles);
    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.pdf`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);

    removeUpload(issue.pdf?.filename);
    issue.pdf = {
      filename,
      originalName: `${issue.year}-yil-${issue.number}-son.pdf`,
      size: bytes.length,
      generated: true,
      generatedAt: new Date(),
    };
    await issue.save();
    res.json({ issue, pages, warnings, message: `PDF kitob tayyor: ${articles.length} ta maqola, ${pages} sahifa` });
  })
);

/* ---------------- Statik sahifalar ---------------- */
function pagePayload(body) {
  const data = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.eyebrow !== undefined) data.eyebrow = String(body.eyebrow).trim();
  if (body.showUpdated !== undefined) data.showUpdated = !!body.showUpdated;
  if (body.body !== undefined) data.body = toParagraphs(body.body);
  return data;
}

router.get(
  '/pages',
  asyncHandler(async (req, res) => {
    res.json(await Page.find().sort({ title: 1 }).lean());
  })
);

router.get(
  '/pages/:id',
  validId,
  asyncHandler(async (req, res) => {
    const page = await Page.findById(req.params.id).lean();
    if (!page) return notFound(res, 'Sahifa');
    res.json(page);
  })
);

router.post(
  '/pages',
  asyncHandler(async (req, res) => {
    const data = pagePayload(req.body || {});
    data.slug = await uniqueSlug(Page, req.body.slug || data.title);
    res.status(201).json(await Page.create(data));
  })
);

router.put(
  '/pages/:id',
  validId,
  asyncHandler(async (req, res) => {
    const page = await Page.findById(req.params.id);
    if (!page) return notFound(res, 'Sahifa');
    page.set(pagePayload(req.body || {}));
    await page.save();
    res.json(page);
  })
);

router.delete(
  '/pages/:id',
  validId,
  asyncHandler(async (req, res) => {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) return notFound(res, 'Sahifa');
    res.json({ message: 'Sahifa o‘chirildi' });
  })
);

/* ---------------- Arizalar ---------------- */
router.get(
  '/submissions',
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = 20;
    const filter = {};
    if (['new', 'review', 'accepted', 'rejected'].includes(req.query.status)) filter.status = req.query.status;
    const [items, total] = await Promise.all([
      Submission.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Submission.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  })
);

router.patch(
  '/submissions/:id',
  validId,
  asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return notFound(res, 'Ariza');
    submission.status = req.body?.status;
    await submission.save();
    res.json(submission);
  })
);

router.delete(
  '/submissions/:id',
  validId,
  asyncHandler(async (req, res) => {
    const submission = await Submission.findByIdAndDelete(req.params.id);
    if (!submission) return notFound(res, 'Ariza');
    res.json({ message: 'Ariza o‘chirildi' });
  })
);

export default router;
