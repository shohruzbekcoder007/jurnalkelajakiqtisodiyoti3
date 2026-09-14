import { Router } from 'express';
import Issue from '../models/Issue.js';
import Article from '../models/Article.js';
import { asyncHandler, issueTitle } from '../utils/asyncHandler.js';

const router = Router();

const publicIssue = (i, articleCount = 0) => ({
  _id: i._id,
  year: i.year,
  number: i.number,
  title: issueTitle(i),
  isCurrent: !!i.isCurrent,
  isOpen: i.isOpen !== false,
  publishedAt: i.publishedAt,
  pdf: i.pdf?.filename ? { filename: i.pdf.filename, originalName: i.pdf.originalName, size: i.pdf.size } : null,
  articleCount,
});

async function countsByIssue() {
  const counts = await Article.aggregate([{ $group: { _id: '$issue', count: { $sum: 1 } } }]);
  return new Map(counts.map((c) => [String(c._id), c.count]));
}

// GET /api/issues — jurnal sonlari arxivi
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [issues, counts] = await Promise.all([Issue.find().sort({ year: -1, number: -1 }).lean(), countsByIssue()]);
    res.json(issues.map((i) => publicIssue(i, counts.get(String(i._id)) || 0)));
  })
);

// GET /api/issues/current — so‘nggi son va undagi maqolalar soni
router.get(
  '/current',
  asyncHandler(async (req, res) => {
    const issue =
      (await Issue.findOne({ isCurrent: true }).lean()) ||
      (await Issue.findOne().sort({ year: -1, number: -1 }).lean());
    if (!issue) return res.status(404).json({ message: 'Son topilmadi' });
    const articleCount = await Article.countDocuments({ issue: issue._id });
    res.json(publicIssue(issue, articleCount));
  })
);

// GET /api/issues/:year/:number — son va undagi barcha maqolalar
router.get(
  '/:year/:number',
  asyncHandler(async (req, res) => {
    const year = parseInt(req.params.year, 10);
    const number = parseInt(req.params.number, 10);
    if (!year || !number) return res.status(404).json({ message: 'Son topilmadi' });

    const issue = await Issue.findOne({ year, number }).lean();
    if (!issue) return res.status(404).json({ message: 'Son topilmadi' });

    const articles = await Article.find({ issue: issue._id })
      .select('-body')
      .sort({ publishedAt: 1, _id: 1 })
      .populate('rubric', 'name slug')
      .lean();
    const title = issueTitle(issue);
    articles.forEach((a) => (a.issue = { _id: issue._id, year, number, title }));

    res.json({ ...publicIssue(issue, articles.length), articles });
  })
);

export default router;
