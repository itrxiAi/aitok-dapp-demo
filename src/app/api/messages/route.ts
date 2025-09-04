import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notifications';
import { NotificationType } from '@/services/api';

/**
 * API endpoint to send a private message as a notification
 */
export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { senderAddress, recipientAddress, message } = json;

    if (!senderAddress || !recipientAddress || !message) {
      return NextResponse.json(
        { error: 'Sender address, recipient address, and message are required' },
        { status: 400 }
      );
    }

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { wallet_address: recipientAddress },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Create notification for the message
    const notification = await createNotification({
      recipientAddress,
      senderAddress,
      type: NotificationType.MESSAGE,
      text: message,
    });

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
