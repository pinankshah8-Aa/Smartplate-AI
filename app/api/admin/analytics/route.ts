import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Attendance from '@/models/Attendance';
import { LRUCache } from 'lru-cache';

// Cache for 5 minutes
const cache = new LRUCache<string, any>({
  max: 10,
  ttl: 1000 * 60 * 5,
});

export async function GET() {
  try {
    const cachedData = cache.get('analytics');
    if (cachedData) {
      return NextResponse.json({ success: true, data: cachedData, cached: true });
    }

    await dbConnect();

    // Get the last 30 days of data
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() * 60000;
    const istOffset = 5.5 * 60 * 60000;
    const today = new Date(now.getTime() + utcOffset + istOffset);

    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const attendanceRecords = await Attendance.find({
      dateString: { $in: dates }
    });

    const analytics = dates.map(date => {
      const dayRecords = attendanceRecords.filter(r => r.dateString === date);
      const attending = dayRecords.filter(r => r.status === 'going').length;
      const notGoing = dayRecords.filter(r => r.status === 'not_going').length;
      const collected = dayRecords.filter(r => r.status === 'going' && r.collectedFood).length;
      
      const wasteSaved = notGoing * 0.4; // 400g per meal saved

      return {
        date,
        attending,
        notGoing,
        collected,
        wasteSavedKg: parseFloat(wasteSaved.toFixed(2))
      };
    });

    cache.set('analytics', analytics);

    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
