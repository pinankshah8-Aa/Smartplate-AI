import mongoose from 'mongoose';

const RatingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateString: { type: String, required: true },
  menu: { type: String, required: true },
  rating: { type: String, enum: ['up', 'down'], required: true },
  comment: { type: String }
}, { timestamps: true });

export default mongoose.models.Rating || mongoose.model('Rating', RatingSchema);
