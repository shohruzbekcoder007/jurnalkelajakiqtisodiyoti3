import { Router } from 'express';
import Rubric from '../models/Rubric.js';
import Article from '../models/Article.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/rubrics — ruknlar va har biridagi maqolalar soni
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [rubrics, counts] = await Promise.all([
      Rubric.find().sort({ order: 1 }).lean(),
      Article.aggregate([{ $group: { _id: '$rubric', count: { $sum: 1 } } }]),
    ]);
    const byId = new Map(counts.map((c) => [String(c._id), c.count]));
    res.json(rubrics.map((r) => ({ ...r, articleCount: byId.get(String(r._id)) || 0 })));
  })
);

export default router;
