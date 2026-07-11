import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'staff', 'admin', 'owner'], default: 'student' },
  name: { type: String, required: true },
  institutionName: { type: String, default: 'Not specified' },
  isActive: { type: Boolean, default: true },
  deactivatedAt: { type: Date },
  isApproved: { type: Boolean, default: false },
  missedMeals: { type: Number, default: 0 },
  ecoPoints: { type: Number, default: 0 },
  mealsEaten: { type: Number, default: 0 },
  wasteAvoidedKg: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
