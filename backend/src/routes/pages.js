import { Router } from 'express';
import Page from '../models/Page.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// GET /api/pages — header menyusi uchun barcha sahifalar (yaratilish tartibida)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const pages = await Page.find({}, 'slug title').sort({ createdAt: 1 }).lean();
    res.json(pages);
  })
);

// GET /api/pages/:slug — statik sahifalar (Jurnal haqida, Tahririyat kengashi, ...)
router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const page = await Page.findOne({ slug: req.params.slug }).lean();
    if (!page) return res.status(404).json({ message: 'Sahifa topilmadi' });
    res.json(page);
  })
);

export default router;
