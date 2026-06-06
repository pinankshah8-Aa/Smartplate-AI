import mongoose from 'mongoose';

const EmergencyRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateString: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' }
}, { timestamps: true });

export default mongoose.models.EmergencyRequest || mongoose.model('EmergencyRequest', EmergencyRequestSchema);
