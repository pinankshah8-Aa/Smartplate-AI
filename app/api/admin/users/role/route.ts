import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_123';

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('smartplate_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'admin' && decoded.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    const staff = await User.find({ role: { $in: ['staff', 'admin', 'owner'] } }, '-passwordHash').lean();

    return NextResponse.json({ success: true, staff });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('smartplate_token')?.value;

    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Forbidden: Only owners can manage roles' }, { status: 403 });
    }

    const { targetUsername, action, username, password, name, role } = await req.json();
    if (!action || !['create', 'promote', 'demote', 'deactivate', 'reactivate', 'delete'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    await dbConnect();

    if (action === 'create') {
      if (!username || !password || !name || !role || !['staff', 'admin'].includes(role)) {
        return NextResponse.json({ success: false, error: 'Invalid create input' }, { status: 400 });
      }
      const existing = await User.findOne({ username });
      if (existing) return NextResponse.json({ success: false, error: 'Username exists' }, { status: 400 });

      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 10);
      await User.create({ username, passwordHash, name, role, isApproved: true, institutionName: 'Not applicable' });
      return NextResponse.json({ success: true, message: 'Account created' });
    }

    if (!targetUsername) {
      return NextResponse.json({ success: false, error: 'Missing target username' }, { status: 400 });
    }

    await dbConnect();

    const targetUser = await User.findOne({ username: targetUsername });
    if (!targetUser) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    if (targetUser.role === 'owner') {
      return NextResponse.json({ success: false, error: 'Cannot alter owner roles' }, { status: 403 });
    }

    if (action === 'promote') {
      targetUser.role = 'admin';
    } else if (action === 'demote') {
      targetUser.role = 'staff';
    } else if (action === 'deactivate') {
      targetUser.isActive = false;
      targetUser.deactivatedAt = new Date();
    } else if (action === 'reactivate') {
      targetUser.isActive = true;
      targetUser.deactivatedAt = undefined;
    } else if (action === 'delete') {
      await User.findByIdAndDelete(targetUser._id);
      return NextResponse.json({ success: true, message: 'User permanently deleted' });
    }

    await targetUser.save();
    return NextResponse.json({ success: true, message: `Action ${action} completed successfully` });

  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
