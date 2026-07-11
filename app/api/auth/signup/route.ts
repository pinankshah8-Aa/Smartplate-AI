import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { username, password, name, institutionName } = await req.json();
    await dbConnect();

    const existing = await User.findOne({ username });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Username already exists' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      passwordHash: hash,
      name,
      role: 'student',
      institutionName: institutionName || 'Demo Institution',
      isApproved: true
    });

    return NextResponse.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
