import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Maqola nomini kiriting'], trim: true, maxlength: 500 },
    authors: { type: String, required: [true, 'Mualliflarni kiriting'], trim: true, maxlength: 500 },
    email: {
      type: String,
      required: [true, 'Elektron pochtani kiriting'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Elektron pochta noto‘g‘ri'],
    },
    abstract: { type: String, required: [true, 'Annotatsiyani kiriting'], trim: true, maxlength: 10000 },
    message: { type: String, trim: true, default: '', maxlength: 5000 },
    status: { type: String, enum: ['new', 'review', 'accepted', 'rejected'], default: 'new' },
  },
  { timestamps: true }
);

export default mongoose.model('Submission', submissionSchema);
