import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    summary: { type: String, default: '' },
    authors: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    body: { type: [String], default: [] },
    rubric: { type: mongoose.Schema.Types.ObjectId, ref: 'Rubric', required: true },
    issue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    publishedAt: { type: Date, required: true },
    pdf: {
      filename: String,
      originalName: String,
      size: Number,
    },
  },
  { timestamps: true }
);

articleSchema.index({ publishedAt: -1 });

export default mongoose.model('Article', articleSchema);
