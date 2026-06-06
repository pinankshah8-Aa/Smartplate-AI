import mongoose from 'mongoose';

const PollSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateString: { type: String, required: true },
  menu: { type: String, required: true },
  voteToChange: { type: Boolean, required: true }
}, { timestamps: true });

// One vote per user per day
PollSchema.index({ userId: 1, dateString: 1 }, { unique: true });

export default mongoose.models.Poll || mongoose.model('Poll', PollSchema);
