import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    year: { type: Number, required: [true, 'Yilni kiriting'], min: 1900, max: 3000 },
    number: { type: Number, required: [true, 'Son raqamini kiriting'], min: 1 },
    // Bosh sahifadagi "So'nggi son"
    isCurrent: { type: Boolean, default: false },
    // Yopiq songa maqola biriktirib bo'lmaydi
    isOpen: { type: Boolean, default: true },
    publishedAt: { type: Date },
    // Sonning to'liq PDF kitobi (qo'lda yuklangan yoki maqolalardan yig'ilgan)
    pdf: {
      filename: String,
      originalName: String,
      size: Number,
      generated: Boolean,
      generatedAt: Date,
    },
  },
  { timestamps: true }
);

issueSchema.index({ year: 1, number: 1 }, { unique: true });

export default mongoose.model('Issue', issueSchema);
