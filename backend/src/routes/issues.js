import { Router } from 'express';
import Issue from '../models/Issue.js';
import Article from '../models/Article.js';
import { asyncHandler, issueTitle } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/issues/current — so‘nggi son va undagi maqolalar soni
router.get(
  '/current',
  asyncHandler(async (req, res) => {
    const issue =
      (await Issue.findOne({ isCurrent: true }).lean()) ||
      (await Issue.findOne().sort({ year: -1, number: -1 }).lean());
    if (!issue) return res.status(404).json({ message: 'Son topilmadi' });
    const articleCount = await Article.countDocuments({ issue: issue._id });
    res.json({ ...issue, title: issueTitle(issue), articleCount });
  })
);

export default router;
