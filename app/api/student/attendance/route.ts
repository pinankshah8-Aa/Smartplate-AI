import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import { getISTDateString } from '@/utils/time';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ success: false, error: 'Missing userId' }, { status: 400 });

    await dbConnect();
    const dateString = getISTDateString();
    
    const att = await Attendance.findOne({ userId, dateString });
    return NextResponse.json({ success: true, attendance: att ? att.status : 'pending', isSubmitted: att ? att.isSubmitted : false, collectedFood: att ? att.collectedFood : false });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, status, isSubmitted, collectedFood } = await req.json();
    await dbConnect();
    const dateString = getISTDateString();

    const updateData: any = { autoMarked: false };
    if (status !== undefined) updateData.status = status;
    if (isSubmitted !== undefined) updateData.isSubmitted = isSubmitted;
    if (collectedFood !== undefined) updateData.collectedFood = collectedFood;

    await Attendance.findOneAndUpdate(
      { userId, dateString },
      updateData,
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
