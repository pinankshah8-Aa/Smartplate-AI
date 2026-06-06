import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import { getISTDateString } from '@/utils/time';

export async function POST() {
  try {
    await dbConnect();
    const dateString = getISTDateString();
    
    // Find all active students
    const students = await User.find({ role: 'student' });
    let autoMarkedCount = 0;

    for (const student of students) {
      const existing = await Attendance.findOne({ userId: student._id, dateString });
      if (!existing) {
        await Attendance.create({
          userId: student._id,
          dateString,
          status: 'not_going',
          autoMarked: true
        });
        autoMarkedCount++;
      }
    }

    return NextResponse.json({ success: true, autoMarkedCount, message: `Auto-marked ${autoMarkedCount} students as Not Going.` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
