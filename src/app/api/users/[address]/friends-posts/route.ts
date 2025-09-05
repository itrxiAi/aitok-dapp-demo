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

    // Get all posts from mutual follows (friends)
    const posts = await prisma.post.findMany({
      where: {
        author_address: {
          in: mutualFollowAddresses,
        },
      },
      include: {
        author: {
          select: {
            wallet_address: true,
            username: true,
            display_name: true,
            avatar_url: true,
          },
        },
        likes: {
          select: {
            user_address: true,
          },
        },
        collects: {
          select: {
            user_address: true,
          },
        },
        comments: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching friends posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends posts' },
      { status: 500 }
    );
  }
}
