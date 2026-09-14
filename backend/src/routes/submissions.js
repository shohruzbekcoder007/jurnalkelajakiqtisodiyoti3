import { Router } from 'express';
import Submission from '../models/Submission.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// POST /api/submissions — "Maqola yuborish" shakli
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { title, authors, email, abstract, message } = req.body || {};
    const submission = await Submission.create({ title, authors, email, abstract, message });
    res.status(201).json({ message: 'Maqolangiz tahririyatga yuborildi', id: submission._id });
  })
);

export default router;
