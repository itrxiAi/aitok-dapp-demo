import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');

    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { is_unfollow: true },
          {
            author: {
              followers: {
                some: {
                  follower_address: userAddress || '',
                }
              }
            }
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
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { author_address, content, media_url, tags, transaction_hash, is_unfollow } = json;

    // First, ensure the user exists
    await prisma.user.upsert({
      where: {
        wallet_address: author_address,
      },
      update: {},  // No updates if exists
      create: {
        wallet_address: author_address,
      },
    });

    const post = await prisma.post.create({
      data: {
        author_address,
        content,
        media_url: media_url || [],
        transaction_hash,
        is_unfollow: is_unfollow || false,
        tags: {
          create: tags?.map((tag: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tag },
                create: { name: tag },
              },
            },
          })) || [],
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
        tags: {
          select: {
            tag_name: true,
          },
        },
      },
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
