import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 1,
  ttl: 1000 * 60 * 5, // Cache for 5 minutes
});

export async function GET() {
  try {
    const cachedLeaderboard = cache.get('leaderboard');
    if (cachedLeaderboard) {
      return NextResponse.json({ success: true, leaderboard: cachedLeaderboard, cached: true });
    }

    await dbConnect();

    // Fetch top 10 students by ecoPoints
    const topStudents = await User.find({ role: 'student' })
      .sort({ ecoPoints: -1 })
      .limit(10)
      .select('name ecoPoints mealsEaten wasteAvoidedKg -_id');

    cache.set('leaderboard', topStudents);

    return NextResponse.json({ success: true, leaderboard: topStudents });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
