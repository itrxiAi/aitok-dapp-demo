import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification, formatNotificationText } from '@/lib/notifications';
import { NotificationType } from '@/services/api';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json();
    const { user_address, transaction_hash } = json;

    const collect = await prisma.collect.create({
      data: {
        post_id: params.id,
        user_address,
        transaction_hash,
      },
    });

    // Get post author to send notification
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { author_address: true }
    });

    return NextResponse.json(collect);
  } catch (error) {
    console.error('Error creating collect:', error);
    return NextResponse.json(
      { error: 'Failed to create collect' },
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

    const collect = await prisma.collect.delete({
      where: {
        post_id_user_address: {
          post_id: params.id,
          user_address,
        },
      },
    });

    return NextResponse.json(collect);
  } catch (error) {
    console.error('Error deleting collect:', error);
    return NextResponse.json(
      { error: 'Failed to delete collect' },
      { status: 500 }
    );
  }
}
