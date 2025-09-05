import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const address = params.address;
    
    // Find all posts that the user has collected
    const collectedPosts = await prisma.post.findMany({
      where: {
        collects: {
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

    return NextResponse.json(collectedPosts);
  } catch (error) {
    console.error('Error fetching collected posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collected posts' },
      { status: 500 }
    );
  }
}
