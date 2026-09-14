import { Router } from 'express';
import Article from '../models/Article.js';
import Rubric from '../models/Rubric.js';
import { asyncHandler, issueTitle } from '../utils/asyncHandler.js';

const router = Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const withIssueTitle = (a) => {
  if (a.issue) a.issue.title = issueTitle(a.issue);
  return a;
};

// GET /api/articles?page=1&limit=7&rubric=<slug>&q=<matn>
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 7, 1), 50);
    const filter = {};

    if (req.query.rubric) {
      const rubric = await Rubric.findOne({ slug: req.query.rubric }).lean();
      if (!rubric) return res.json({ items: [], total: 0, page, pages: 1, limit });
      filter.rubric = rubric._id;
    }
    const q = String(req.query.q || '').trim();
    if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };

    const [items, total] = await Promise.all([
      Article.find(filter)
        .select('-body')
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('rubric', 'name slug')
        .populate('issue', 'year number')
        .lean(),
      Article.countDocuments(filter),
    ]);

    res.json({
      items: items.map(withIssueTitle),
      total,
      page,
      pages: Math.max(Math.ceil(total / limit), 1),
      limit,
    });
  })
);

// GET /api/articles/featured — admin tanlagan maqolalar (o'rin tartibida)
router.get(
  '/featured',
  asyncHandler(async (req, res) => {
    const items = await Article.find({ featuredOrder: { $gte: 1 } })
      .select('-body')
      .sort({ featuredOrder: 1 })
      .limit(3)
      .populate('rubric', 'name slug')
      .populate('issue', 'year number')
      .lean();
    res.json(items.map(withIssueTitle));
  })
);

// GET /api/articles/:slug
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const article = await Article.findOne({ slug: req.params.slug })
      .populate('rubric', 'name slug')
      .populate('issue', 'year number')
      .lean();
    if (!article) return res.status(404).json({ message: 'Maqola topilmadi' });
    res.json(withIssueTitle(article));
  })
);

export default router;
