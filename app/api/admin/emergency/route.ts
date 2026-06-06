import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import EmergencyRequest from '@/models/EmergencyRequest';
import User from '@/models/User';

export async function GET() {
  try {
    await dbConnect();
    const requests = await EmergencyRequest.find({ status: 'pending' }).populate('userId', 'name').lean();
    return NextResponse.json({ success: true, requests });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { requestId, action } = await req.json(); // action: 'approve' or 'deny'
    await dbConnect();
    
    await EmergencyRequest.findByIdAndUpdate(requestId, { status: action === 'approve' ? 'approved' : 'denied' });
    
    return NextResponse.json({ success: true, message: `Request ${action}d` });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
