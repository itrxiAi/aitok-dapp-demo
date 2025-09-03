import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const requestingUserAddress = searchParams.get('requestingUserAddress');

    let users = [];
    let posts = [];

    if (type === 'all' || type === 'users') {
      users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { display_name: { contains: query, mode: 'insensitive' } },
            { wallet_address: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
            },
          },
        },
        take: 10,
      });
    }

    if (type === 'all' || type === 'posts') {
      posts = await prisma.post.findMany({
        where: {
          AND: [
            {
              OR: [
                { content: { contains: query, mode: 'insensitive' } },
                { tags: { some: { tag: { name: { contains: query, mode: 'insensitive' } } } } },
              ],
            },
            {
              OR: [
                { is_unfollow: true },
                {
                  author: {
                    followers: {
                      some: {
                        follower_address: requestingUserAddress || '',
                      }
                    }
                  }
                }
              ]
            }
          ]
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
          comments: {
            select: {
              id: true,
            },
          },
          tags: {
            select: {
              tag_name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 20,
      });
    }

    return NextResponse.json({ users, posts });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}
