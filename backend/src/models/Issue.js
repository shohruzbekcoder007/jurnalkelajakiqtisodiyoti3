import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    number: { type: Number, required: true },
    isCurrent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

issueSchema.index({ year: 1, number: 1 }, { unique: true });

export default mongoose.model('Issue', issueSchema);
