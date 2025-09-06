import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;
    
    // Find all posts created by the user
    const myPosts = await prisma.post.findMany({
      where: {
        author_address: address
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
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Add isFollowing field to each post's author
    const postsWithFollowingInfo = myPosts.map((post) => ({
      ...post,
      author: {
        ...post.author,
        isFollowing: true
      }
    }));

    return NextResponse.json(postsWithFollowingInfo);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user posts' },
      { status: 500 }
    );
  }
}
