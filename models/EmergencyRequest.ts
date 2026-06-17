import mongoose from 'mongoose';

const EmergencyRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateString: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' }
}, { timestamps: true });

EmergencyRequestSchema.index({ userId: 1, dateString: 1 });
EmergencyRequestSchema.index({ dateString: 1 });

export default mongoose.models.EmergencyRequest || mongoose.model('EmergencyRequest', EmergencyRequestSchema);
