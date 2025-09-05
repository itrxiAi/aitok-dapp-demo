import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;

    // Get all users who the current user follows
    const following = await prisma.follow.findMany({
      where: {
        follower_address: address,
      },
      select: {
        following_address: true,
      },
    });

    // Get all users who follow the current user
    const followers = await prisma.follow.findMany({
      where: {
        following_address: address,
      },
      select: {
        follower_address: true,
      },
    });

    // Find mutual follows (friends) - users who follow each other
    const followingAddresses = following.map(f => f.following_address);
    const followerAddresses = followers.map(f => f.follower_address);
    
    // Find addresses that appear in both arrays (mutual follows)
    const mutualFollowAddresses = followingAddresses.filter(address => 
      followerAddresses.includes(address)
    );

    // Get detailed user information for all mutual follows
    const friends = await prisma.user.findMany({
      where: {
        wallet_address: {
          in: mutualFollowAddresses,
        },
      },
      select: {
        wallet_address: true,
        username: true,
        display_name: true,
        avatar_url: true,
        bio: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
    });

    return NextResponse.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;
    const { friendAddress } = await request.json();

    // Check if the user is already following the friend
    const existingFollow = await prisma.follow.findUnique({
      where: {
        follower_address_following_address: {
          follower_address: address,
          following_address: friendAddress,
        },
      },
    });

    if (!existingFollow) {
      // If not following, create the follow relationship
      await prisma.follow.create({
        data: {
          follower_address: address,
          following_address: friendAddress,
        },
      });

      // Create notification for the follow action
      await prisma.notification.create({
        data: {
          type: 'FOLLOW',
          sender_address: address,
          recipient_address: friendAddress,
          text: 'started following you',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding friend:', error);
    return NextResponse.json(
      { error: 'Failed to add friend' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;
    const url = new URL(request.url);
    const friendAddress = url.searchParams.get('friendAddress');

    if (!friendAddress) {
      return NextResponse.json(
        { error: 'Friend address is required' },
        { status: 400 }
      );
    }

    // Delete the follow relationship (unfollow)
    await prisma.follow.delete({
      where: {
        follower_address_following_address: {
          follower_address: address,
          following_address: friendAddress,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}
