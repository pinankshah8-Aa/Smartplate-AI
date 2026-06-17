import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId, action } = await req.json(); // action: 'approve' or 'reject'
    await dbConnect();

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    if (action === 'approve') {
      await User.findByIdAndUpdate(userId, { isApproved: true });
    } else if (action === 'reject') {
      await User.findByIdAndDelete(userId);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
