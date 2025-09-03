import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CHAT_SERVICE_URL = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:8000';

export async function POST(request: Request) {
  try {
    const { user_address, messages } = await request.json();

    // Fetch user's avatar_real_url from database
    const user = await prisma.user.findUnique({
      where: {
        wallet_address: user_address
      },
      select: {
        avatar_real_url: true,
        gender: true
      }
    });
    console.log(`wallet_address:${user_address} user:${JSON.stringify(user)}`);

    // Get the absolute path for the avatar
    const avatar_path = user?.avatar_real_url 
      ? path.join(process.cwd(), 'public', user.avatar_real_url)
      : path.join(process.cwd(), 'public', 'uploads/654b536c8c46e155141a426a.png');

    // Determine gender code
    const genderCode = user?.gender === 'FEMALE' ? 'BV001' : 'BV002';

    const response = await fetch(`${CHAT_SERVICE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_address,
        messages,
        avatar_path,
        gender_code: genderCode,
      }),
    });

    if (!response.ok) {
      throw new Error('Chat service error');
    }

    const data = await response.json();

    const VIDEO_SERVICE_URL = fs.readFileSync(path.join(process.cwd(), 'videourl.txt'), 'utf8').trim();
    
    // Add the base URL to the video and audio URLs
    if (data.video_url) {
      data.video_url = `${VIDEO_SERVICE_URL}${data.video_url}`;
    }
    if (data.audio_url) {
      data.audio_url = `${VIDEO_SERVICE_URL}${data.audio_url}`;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
