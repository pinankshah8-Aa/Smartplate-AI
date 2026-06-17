import mongoose from 'mongoose';

const MenuSchema = new mongoose.Schema({
  dateString: { type: String, required: true, unique: true }, // YYYY-MM-DD
  breakfast: { type: String, default: '' },
  lunch: { type: String, default: '' },
  dinner: { type: String, default: '' }
}, { timestamps: true });

// Add index for fast lookup by date
MenuSchema.index({ dateString: 1 });

export default mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
