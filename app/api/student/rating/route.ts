import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Rating from '@/models/Rating';
import { getISTDateString } from '@/utils/time';

export async function POST(req: Request) {
  try {
    const { userId, menu, rating, comment } = await req.json();
    await dbConnect();
    const dateString = getISTDateString();

    await Rating.findOneAndUpdate(
      { userId, dateString },
      { menu, rating, comment },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
