import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Setting from '@/models/Setting';

export async function GET() {
  try {
    await dbConnect();
    const setting = await Setting.findOne({ key: 'cutoffTime' });
    return NextResponse.json({ success: true, cutoffTime: setting ? setting.value : '08:30' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { cutoffTime } = await req.json();
    await dbConnect();
    await Setting.findOneAndUpdate(
      { key: 'cutoffTime' },
      { value: cutoffTime },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, cutoffTime });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
