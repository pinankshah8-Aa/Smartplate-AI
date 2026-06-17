import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  name: { type: String, required: true },
  missedMeals: { type: Number, default: 0 },
  ecoPoints: { type: Number, default: 0 },
  mealsEaten: { type: Number, default: 0 },
  wasteAvoidedKg: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const passwordHash = await bcrypt.hash('password123', 10);

    // Seed Demo Student
    await User.findOneAndUpdate(
      { username: 'demo_student' },
      {
        username: 'demo_student',
        passwordHash,
        name: 'Demo Student',
        role: 'student',
        ecoPoints: 120,
        mealsEaten: 45,
        wasteAvoidedKg: 2.5
      },
      { upsert: true, new: true }
    );
    console.log('Demo Student seeded');

    // Seed Demo Admin
    await User.findOneAndUpdate(
      { username: 'demo_admin' },
      {
        username: 'demo_admin',
        passwordHash,
        name: 'Demo Admin',
        role: 'admin'
      },
      { upsert: true, new: true }
    );
    console.log('Demo Admin seeded');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
