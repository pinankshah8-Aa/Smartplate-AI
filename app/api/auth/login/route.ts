import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { LRUCache } from 'lru-cache';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_123';

const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

// Rate limit: 50 requests per minute per IP
const rateLimitCache = new LRUCache<string, number>({
  max: 500,
  ttl: 1000 * 60 * 1, // 1 minute
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const currentRequests = rateLimitCache.get(ip) || 0;
    if (currentRequests >= 50) {
      return NextResponse.json({ success: false, error: 'Too many login attempts, please try again in a minute.' }, { status: 429 });
    }
    rateLimitCache.set(ip, currentRequests + 1);

    const body = await req.json();
    const result = LoginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Invalid input data' }, { status: 400 });
    }

    const { username, password } = result.data;
    await dbConnect();

    // Auto-seed/fix demo credentials on login attempt
    if (username === 'admin') {
      let adminDemo = await User.findOne({ username: 'admin' });
      if (!adminDemo) {
        adminDemo = new User({ username: 'admin', name: 'Admin Demo' });
      }
      adminDemo.passwordHash = await bcrypt.hash('admin123', 10);
      adminDemo.role = 'owner';
      adminDemo.isActive = true;
      adminDemo.isApproved = true;
      await adminDemo.save();
    }
    
    if (username === 'student') {
      let studentDemo = await User.findOne({ username: 'student' });
      if (!studentDemo) {
        studentDemo = new User({ username: 'student', name: 'Student Demo' });
      }
      studentDemo.passwordHash = await bcrypt.hash('student123', 10);
      studentDemo.role = 'student';
      studentDemo.isActive = true;
      studentDemo.isApproved = true;
      await studentDemo.save();
    }

    let user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.isActive === false) {
      return NextResponse.json({ success: false, error: 'Account has been deactivated. Please contact your institution.' }, { status: 403 });
    }

    if (!user.isApproved && user.role === 'student') {
      return NextResponse.json({ success: false, error: 'Account pending admin approval' }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ id: user._id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });

    response.cookies.set('smartplate_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Login error details:', error.message || error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
