import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification, formatNotificationText } from '@/lib/notifications';
import { NotificationType } from '@/services/api';

export async function POST(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const json = await request.json();
    const { follower_address } = json;

    const follow = await prisma.follow.create({
      data: {
        follower_address,
        following_address: params.address,
      },
    });

    // Create notification for the user being followed
    await createNotification({
      recipientAddress: params.address,
      senderAddress: follower_address,
      type: NotificationType.FOLLOW,
      text: "",
    });

    return NextResponse.json(follow);
  } catch (error) {
    console.error('Error following user:', error);
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const follower_address = searchParams.get('follower_address');

    if (!follower_address) {
      return NextResponse.json(
        { error: 'Follower address is required' },
        { status: 400 }
      );
    }

    await prisma.follow.delete({
      where: {
        follower_address_following_address: {
          follower_address,
          following_address: params.address,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const follower_address = searchParams.get('follower_address');

    if (!follower_address) {
      return NextResponse.json(
        { error: 'Follower address is required' },
        { status: 400 }
      );
    }

    const follow = await prisma.follow.findUnique({
      where: {
        follower_address_following_address: {
          follower_address,
          following_address: params.address,
        },
      },
    });

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}
