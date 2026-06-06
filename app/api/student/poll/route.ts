import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Poll from '@/models/Poll';
import { getISTDateString } from '@/utils/time';

export async function POST(req: Request) {
  try {
    const { userId, menu, voteToChange } = await req.json();
    await dbConnect();
    const dateString = getISTDateString();

    await Poll.findOneAndUpdate(
      { userId, dateString },
      { menu, voteToChange },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
