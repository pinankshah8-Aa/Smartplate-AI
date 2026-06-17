import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Menu from '@/models/Menu';

// Get a menu by date
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateString = searchParams.get('dateString');

    await dbConnect();

    if (dateString) {
      const menu = await Menu.findOne({ dateString });
      return NextResponse.json({ success: true, menu });
    }

    // If no dateString provided, get the next 7 days starting today
    const now = new Date();
    const utcOffset = now.getTimezoneOffset() * 60000;
    const istOffset = 5.5 * 60 * 60000;
    const today = new Date(now.getTime() + utcOffset + istOffset);

    const dates = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const menus = await Menu.find({ dateString: { $in: dates } });
    return NextResponse.json({ success: true, menus });

  } catch (error) {
    console.error('Menu GET error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}

// Update or create a menu
export async function POST(req: Request) {
  try {
    const { dateString, breakfast, lunch, dinner } = await req.json();

    if (!dateString) {
      return NextResponse.json({ success: false, error: 'dateString is required' }, { status: 400 });
    }

    await dbConnect();

    const menu = await Menu.findOneAndUpdate(
      { dateString },
      { breakfast, lunch, dinner },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, menu });
  } catch (error) {
    console.error('Menu POST error:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
