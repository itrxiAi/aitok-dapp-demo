import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;
    
    // Find all posts that the user has liked
    // Get the list of users that the current user is following
    const followingList = await prisma.follow.findMany({
      where: {
        follower_address: address
      },
      select: {
        following_address: true
      }
    });
    
    const followingAddresses = followingList.map(follow => follow.following_address);
    followingAddresses.push(address);
    
    const likedPosts = await prisma.post.findMany({
      where: {
        likes: {
          some: {
            user_address: address
          }
        }
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
        comments: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                wallet_address: true,
                username: true,
                display_name: true,
              },
            },
            created_at: true,
          },
          take: 3,
          orderBy: {
            created_at: 'desc',
          },
        },
        tags: {
          select: {
            tag_name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Add isFollowing field to each post's author
    const postsWithFollowingInfo = likedPosts.map(post => ({
      ...post,
      author: {
        ...post.author,
        isFollowing: followingAddresses.includes(post.author.wallet_address)
      }
    }));
    
    return NextResponse.json(postsWithFollowingInfo);
  } catch (error) {
    console.error('Error fetching liked posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch liked posts' },
      { status: 500 }
    );
  }
}
