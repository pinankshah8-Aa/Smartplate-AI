import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateString: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, enum: ['pending', 'going', 'not_going'], default: 'pending' },
  isSubmitted: { type: Boolean, default: false },
  autoMarked: { type: Boolean, default: false },
  collectedFood: { type: Boolean, default: false },
  collectedAt: { type: Date }
}, { timestamps: true });

// Ensure one record per user per day
AttendanceSchema.index({ userId: 1, dateString: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
