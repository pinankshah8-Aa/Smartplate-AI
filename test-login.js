require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/smartplate");
  const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    name: { type: String, required: true }
  });
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  const username = "admin";
  const password = "admin123";
  let user = await User.findOne({ username });
  if (!user) {
    const hash = await bcrypt.hash(username + '123', 10);
    user = await User.create({
      username,
      passwordHash: hash,
      name: 'Admin Demo',
      role: username
    });
  }
  const isValid = await bcrypt.compare(password, user.passwordHash);
  console.log("Is Valid?", isValid);
  process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
