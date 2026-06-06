import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import EmergencyRequest from '@/models/EmergencyRequest';
import { getISTDateString } from '@/utils/time';

export async function POST(req: Request) {
  try {
    const { userId, reason } = await req.json();
    await dbConnect();
    const dateString = getISTDateString();

    await EmergencyRequest.create({
      userId,
      dateString,
      reason
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
