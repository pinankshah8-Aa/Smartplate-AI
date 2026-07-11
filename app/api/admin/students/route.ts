import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_123';

export async function POST(req: Request) {
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

    const { userId, action } = await req.json();
    if (!userId || !['deactivate', 'reactivate', 'delete'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    if (action === 'delete' && decoded.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'Forbidden: Only owners can permanently delete accounts' }, { status: 403 });
    }

    await dbConnect();

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (targetUser.role === 'admin' || targetUser.role === 'owner' || targetUser.role === 'staff') {
      return NextResponse.json({ success: false, error: 'Cannot modify staff, admin, or owner accounts from student list' }, { status: 403 });
    }

    if (action === 'delete') {
      await User.findByIdAndDelete(userId);
      return NextResponse.json({ success: true, message: 'Student permanently deleted' });
    } else if (action === 'deactivate') {
      targetUser.isActive = false;
      targetUser.deactivatedAt = new Date();
    } else {
      targetUser.isActive = true;
      targetUser.deactivatedAt = undefined;
    }
    
    await targetUser.save();

    return NextResponse.json({ success: true, message: `Student ${action}d successfully` });
  } catch (error) {
    console.error('Deactivate student error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
