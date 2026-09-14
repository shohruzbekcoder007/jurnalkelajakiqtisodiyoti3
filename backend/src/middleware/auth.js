import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export const signToken = (admin) =>
  jwt.sign({ sub: String(admin._id) }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

export async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Avtorizatsiya talab qilinadi' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(payload.sub).lean();
    if (!admin) return res.status(401).json({ message: 'Foydalanuvchi topilmadi' });
    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ message: 'Sessiya muddati tugagan, qaytadan kiring' });
  }
}
