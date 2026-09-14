import { Router } from 'express';
import Admin from '../models/Admin.js';
import { requireAdmin, signToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Oddiy brute-force himoyasi: IP bo'yicha 15 daqiqada 10 ta urinish
const attempts = new Map();
const WINDOW = 15 * 60 * 1000;
function tooManyAttempts(ip) {
  const now = Date.now();
  const list = (attempts.get(ip) || []).filter((t) => now - t < WINDOW);
  list.push(now);
  attempts.set(ip, list);
  return list.length > 10;
}

const publicAdmin = (a) => ({ _id: a._id, name: a.name, email: a.email });

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    if (tooManyAttempts(req.ip)) {
      return res.status(429).json({ message: 'Urinishlar juda ko‘p. 15 daqiqadan so‘ng qayta urinib ko‘ring' });
    }
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email va parolni kiriting' });

    const admin = await Admin.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');
    if (!admin || !(await admin.checkPassword(String(password)))) {
      return res.status(401).json({ message: 'Email yoki parol noto‘g‘ri' });
    }
    attempts.delete(req.ip);
    res.json({ token: signToken(admin), admin: publicAdmin(admin) });
  })
);

// GET /api/auth/me
router.get('/me', requireAdmin, (req, res) => res.json(publicAdmin(req.admin)));

// PUT /api/auth/password
router.put(
  '/password',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ message: 'Yangi parol kamida 8 belgidan iborat bo‘lishi kerak' });
    }
    const admin = await Admin.findById(req.admin._id).select('+passwordHash');
    if (!(await admin.checkPassword(String(currentPassword || '')))) {
      return res.status(400).json({ message: 'Joriy parol noto‘g‘ri' });
    }
    await admin.setPassword(String(newPassword));
    await admin.save();
    res.json({ message: 'Parol yangilandi' });
  })
);

export default router;
