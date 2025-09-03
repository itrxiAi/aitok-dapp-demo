import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const requestingUserAddress = searchParams.get('requestingUserAddress');

    // First check if the requesting user is following the profile user
    const followingStatus = requestingUserAddress ? await prisma.follow.findFirst({
      where: {
        follower_address: requestingUserAddress,
        following_address: params.address
      }
    }) : null;
    console.log(`requestingUserAddress: ${requestingUserAddress}, params.address:${params.address}`);

    const isFollowing = requestingUserAddress === params.address || !!followingStatus;

    // Then fetch the user with appropriate posts
    const user = await prisma.user.findUnique({
      where: {
        wallet_address: params.address,
      },
      include: {
        posts: {
          where: isFollowing ? undefined : { is_unfollow: true },
          include: {
            likes: true,
            comments: true,
            tags: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...user,
      is_following: isFollowing
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const json = await request.json();
    const { username, display_name, bio, avatar_url } = json;

    const user = await prisma.user.upsert({
      where: {
        wallet_address: params.address,
      },
      update: {
        username,
        display_name,
        bio,
        avatar_url,
      },
      create: {
        wallet_address: params.address,
        username,
        display_name,
        bio,
        avatar_url,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
