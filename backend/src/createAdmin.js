// Admin foydalanuvchi yaratadi yoki parolini yangilaydi:
//   npm run create-admin -- admin@tdiu.uz "Parol12345" "Ism Familiya"
// Argument berilmasa .env dagi ADMIN_EMAIL / ADMIN_PASSWORD ishlatiladi.
import 'dotenv/config';
import mongoose from 'mongoose';
import { pathToFileURL } from 'url';
import { connectDB } from './config/db.js';
import Admin from './models/Admin.js';

export async function ensureAdmin({ email, password, name = 'Administrator', reset = false }) {
  if (!email || !password) throw new Error('ADMIN_EMAIL va ADMIN_PASSWORD berilmagan');
  if (String(password).length < 8) throw new Error('Parol kamida 8 belgidan iborat bo‘lishi kerak');

  let admin = await Admin.findOne({ email: email.toLowerCase() });
  if (admin && !reset) return { admin, created: false };
  if (!admin) admin = new Admin({ email, name });
  else admin.name = name || admin.name;
  await admin.setPassword(password);
  await admin.save();
  return { admin, created: true };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [email = process.env.ADMIN_EMAIL, password = process.env.ADMIN_PASSWORD, name] = process.argv.slice(2);
  connectDB(process.env.MONGO_URI)
    .then(() => ensureAdmin({ email, password, name, reset: true }))
    .then(({ admin }) => console.log(`Admin tayyor: ${admin.email}`))
    .catch((err) => {
      console.error(err.message);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
