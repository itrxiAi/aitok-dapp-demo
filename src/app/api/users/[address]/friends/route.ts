import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;

    // Get all friends of the user
    const friendships = await prisma.friend.findMany({
      where: {
        user_address: address,
      },
      include: {
        friend: {
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
        },
      },
    });

    // Transform the data to match the expected format
    const formattedFriends = friendships.map((friendship) => ({
      ...friendship.friend,
    }));

    return NextResponse.json(formattedFriends);
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

    // Check if the friendship already exists
    const existingFriendship = await prisma.friend.findUnique({
      where: {
        user_address_friend_address: {
          user_address: address,
          friend_address: friendAddress,
        },
      },
    });

    if (existingFriendship) {
      return NextResponse.json(
        { error: 'Friendship already exists' },
        { status: 400 }
      );
    }

    // Create the friendship (both ways to make it bidirectional)
    await prisma.$transaction([
      prisma.friend.create({
        data: {
          user_address: address,
          friend_address: friendAddress,
        },
      }),
      prisma.friend.create({
        data: {
          user_address: friendAddress,
          friend_address: address,
        },
      }),
    ]);

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

    // Delete the friendship (both ways)
    await prisma.$transaction([
      prisma.friend.delete({
        where: {
          user_address_friend_address: {
            user_address: address,
            friend_address: friendAddress,
          },
        },
      }),
      prisma.friend.delete({
        where: {
          user_address_friend_address: {
            user_address: friendAddress,
            friend_address: address,
          },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing friend:', error);
    return NextResponse.json(
      { error: 'Failed to remove friend' },
      { status: 500 }
    );
  }
}
