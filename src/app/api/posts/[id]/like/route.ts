import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json();
    const { user_address, transaction_hash } = json;

    const like = await prisma.like.create({
      data: {
        post_id: params.id,
        user_address,
        transaction_hash,
      },
    });

    return NextResponse.json(like);
  } catch (error) {
    console.error('Error creating like:', error);
    return NextResponse.json(
      { error: 'Failed to create like' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json();
    const { user_address } = json;

    const like = await prisma.like.delete({
      where: {
        post_id_user_address: {
          post_id: params.id,
          user_address,
        },
      },
    });

    return NextResponse.json(like);
  } catch (error) {
    console.error('Error deleting like:', error);
    return NextResponse.json(
      { error: 'Failed to delete like' },
      { status: 500 }
    );
  }
}
