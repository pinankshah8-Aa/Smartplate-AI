import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_123';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    await dbConnect();

    let user = await User.findOne({ username });

    // Auto-create demo accounts if they don't exist
    if (!user && (username === 'student' || username === 'admin')) {
      const hash = await bcrypt.hash(username + '123', 10);
      user = await User.create({
        username,
        passwordHash: hash,
        name: username === 'student' ? 'Student Demo' : 'Admin Demo',
        role: username
      });
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Login error details:', error.message || error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
