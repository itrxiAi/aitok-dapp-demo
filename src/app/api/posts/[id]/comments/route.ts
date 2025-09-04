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
    const { content, author_address } = json;

    const comment = await prisma.comment.create({
      data: {
        content,
        author_address,
        post_id: params.id,
      },
      include: {
        author: true,
      },
    });

    // Get post author to send notification
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: { author_address: true }
    });
    
    if (post) {
      // Get commenter info for notification text
      const commenterName = comment.author.display_name || comment.author.username || author_address.substring(0, 8) + '...';
      
      // Create notification for post author
      await createNotification({
        recipientAddress: post.author_address,
        senderAddress: author_address,
        type: NotificationType.COMMENT,
        text: "",
        postId: params.id,
        commentId: comment.id
      });
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        post_id: params.id,
      },
      include: {
        author: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
