import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    summary: { type: String, default: '' },
    authors: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    body: { type: [String], default: [] },
    rubric: { type: mongoose.Schema.Types.ObjectId, ref: 'Rubric', required: [true, 'Ruknni tanlang'] },
    // Har bir maqola albatta biror jurnal soniga tegishli
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: [true, 'Jurnal sonini tanlang'] },
    publishedAt: { type: Date, required: [true, 'Nashr sanasini kiriting'] },
    // Bosh sahifadagi "Tanlangan maqolalar": 1 — katta karta, 2 va 3 — yon kartalar
    featuredOrder: { type: Number, min: 1, max: 3, default: null },
    pdf: {
      filename: String,
      originalName: String,
      size: Number,
    },
  },
  { timestamps: true }
);

articleSchema.index({ publishedAt: -1 });
articleSchema.index({ featuredOrder: 1 });

export default mongoose.model('Article', articleSchema);
