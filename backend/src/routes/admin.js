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
import { pdfUpload, removeUpload } from '../config/upload.js';

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

router.get(
  '/articles/:id',
  validId,
  asyncHandler(async (req, res) => {
    const article = await Article.findById(req.params.id).lean();
    if (!article) return notFound(res, 'Maqola');
    res.json(article);
  })
);

router.post(
  '/articles',
  asyncHandler(async (req, res) => {
    const data = articlePayload(req.body || {});
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
    article.set(articlePayload(req.body || {}));
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
router.get(
  '/issues',
  asyncHandler(async (req, res) => {
    const [issues, counts] = await Promise.all([
      Issue.find().sort({ year: -1, number: -1 }).lean(),
      Article.aggregate([{ $group: { _id: '$issue', count: { $sum: 1 } } }]),
    ]);
    const byId = new Map(counts.map((c) => [String(c._id), c.count]));
    res.json(issues.map((i) => ({ ...i, title: issueTitle(i), articleCount: byId.get(String(i._id)) || 0 })));
  })
);

async function applyCurrent(issue) {
  if (issue.isCurrent) await Issue.updateMany({ _id: { $ne: issue._id } }, { isCurrent: false });
}

router.post(
  '/issues',
  asyncHandler(async (req, res) => {
    const { year, number, isCurrent } = req.body || {};
    const issue = await Issue.create({ year: Number(year), number: Number(number), isCurrent: !!isCurrent });
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
    const { year, number, isCurrent } = req.body || {};
    if (year !== undefined) issue.year = Number(year);
    if (number !== undefined) issue.number = Number(number);
    if (isCurrent !== undefined) issue.isCurrent = !!isCurrent;
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
    res.json({ message: 'Son o‘chirildi' });
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
