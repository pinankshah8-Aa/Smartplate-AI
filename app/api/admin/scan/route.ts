import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_123';

const ScanSchema = z.object({
  userId: z.string().min(1, 'QR Token is required') // the frontend passes the token under 'userId' key
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = ScanSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Invalid QR Token format' }, { status: 400 });
    }

    const userId = result.data.userId;

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

    // Emit socket event for real-time dashboard updates
    if ((global as any).io) {
      (global as any).io.emit('scan_update', {
        userId: user._id,
        studentName: user.name,
        timestamp: formatIST(attendance.collectedAt)
      });
    }

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
