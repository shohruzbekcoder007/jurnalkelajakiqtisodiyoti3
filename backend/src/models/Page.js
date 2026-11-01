import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    eyebrow: { type: String, default: '' },
    title: { type: String, required: true },
    showUpdated: { type: Boolean, default: false },
    // Eski format: oddiy paragraflar. Muharrirda saqlangan sahifalar `content` (HTML) ni ishlatadi
    body: { type: [String], default: [] },
    content: { type: String, default: '' },
    // 'code' — admin yozgan erkin HTML/CSS/JS; saytda sandbox iframe ichida ishlaydi, shuning uchun tozalanmaydi
    format: { type: String, enum: ['rich', 'code'], default: 'rich' },
    code: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Page', pageSchema);
