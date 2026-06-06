import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Rating from '@/models/Rating';
import Poll from '@/models/Poll';
import { getISTDateString } from '@/utils/time';

export async function GET() {
  try {
    await dbConnect();
    const dateString = getISTDateString();

    const ratings = await Rating.find({ dateString }).populate('userId', 'name').lean();
    const polls = await Poll.find({ dateString }).lean();

    const upVotes = ratings.filter((r: any) => r.rating === 'up').length;
    const downVotes = ratings.filter((r: any) => r.rating === 'down').length;
    const totalRatings = upVotes + downVotes;
    
    const comments = ratings.filter((r: any) => r.comment).map((r: any) => ({
      name: r.userId?.name || 'Anonymous',
      comment: r.comment,
      rating: r.rating
    }));

    const totalPolls = polls.length;
    const changeVotes = polls.filter((p: any) => p.voteToChange).length;
    const keepVotes = polls.filter((p: any) => !p.voteToChange).length;

    return NextResponse.json({ 
      success: true, 
      feedback: {
        upVotes, downVotes, totalRatings, comments
      },
      poll: {
        totalPolls, changeVotes, keepVotes
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
