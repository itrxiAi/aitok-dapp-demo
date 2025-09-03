import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { wallet_address, username, display_name, bio, gender, avatar_url, avatar_real_url } = json;

    const user = await prisma.user.upsert({
      where: {
        wallet_address,
      },
      update: {
        username,
        display_name,
        bio,
        gender,
        avatar_url,
        avatar_real_url,
      },
      create: {
        wallet_address,
        username,
        display_name,
        bio,
        gender,
        avatar_url,
        avatar_real_url,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
