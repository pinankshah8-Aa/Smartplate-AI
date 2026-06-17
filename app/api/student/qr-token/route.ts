import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_123';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    return NextResponse.json({ success: true, token: userId });
  } catch (error) {
    console.error('QR Token error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
