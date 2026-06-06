import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Poll from '@/models/Poll';

export async function GET() {
  try {
    await dbConnect();
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() * 60000;
    const istOffset = 5.5 * 60 * 60000; 
    const istDate = new Date(now.getTime() + utcOffset + istOffset);
    const dateString = istDate.toISOString().split('T')[0];

    const menu = 'Paneer Butter Masala'; // Hardcoded for MVP as per requirements

    const changeVotes = await Poll.countDocuments({ dateString, menu, voteToChange: true });
    const keepVotes = await Poll.countDocuments({ dateString, menu, voteToChange: false });
    const totalVotes = changeVotes + keepVotes;

    return NextResponse.json({
      success: true,
      stats: {
        changeVotes,
        keepVotes,
        totalVotes,
        changePercentage: totalVotes > 0 ? Math.round((changeVotes / totalVotes) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Poll stats error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
