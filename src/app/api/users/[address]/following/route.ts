import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const following = await prisma.follow.findMany({
      where: {
        follower_address: params.address,
      },
      include: {
        following: {
          select: {
            wallet_address: true,
            display_name: true,
            username: true,
            avatar_url: true,
            bio: true,
            _count: {
              select: {
                posts: true,
                followers: true,
                following: true,
              }
            }
          }
        }
      }
    });

    const users = following.map(f => f.following);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching following:', error);
    return NextResponse.json(
      { error: 'Failed to fetch following' },
      { status: 500 }
    );
  }
}
