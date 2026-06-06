import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    // Get today's attendance
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() * 60000;
    const istOffset = 5.5 * 60 * 60000; 
    const istDate = new Date(now.getTime() + utcOffset + istOffset);
    const dateString = istDate.toISOString().split('T')[0];

    const attendance = await Attendance.findOne({ userId, dateString });

    if (!attendance) {
      return NextResponse.json({ success: false, error: 'No attendance marked for today' }, { status: 400 });
    }

    if (attendance.status !== 'going') {
      return NextResponse.json({ success: false, error: 'Student marked as NOT going' }, { status: 400 });
    }

    const formatIST = (date: Date) => {
      const utcOffset = date.getTimezoneOffset() * 60000;
      const istOffset = 5.5 * 60 * 60000;
      const istDate = new Date(date.getTime() + utcOffset + istOffset);
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
    };

    if (attendance.collectedFood && attendance.collectedAt) {
      return NextResponse.json({ 
        success: false, 
        alreadyCollected: true, 
        studentName: user.name,
        timestamp: formatIST(attendance.collectedAt)
      });
    }

    // Mark as collected
    attendance.collectedFood = true;
    attendance.collectedAt = new Date();
    await attendance.save();

    return NextResponse.json({ 
      success: true, 
      studentName: user.name,
      timestamp: formatIST(attendance.collectedAt)
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
