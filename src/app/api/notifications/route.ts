import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { formatNotificationText } from '@/lib/notifications';
import { NotificationType } from '@/services/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientAddress = searchParams.get('recipientAddress');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string) : 0;
    const includeRead = searchParams.get('includeRead') === 'true';

    if (!recipientAddress) {
      return NextResponse.json({ error: 'Recipient address is required' }, { status: 400 });
    }

    // Build the where clause
    const where = {
      recipient_address: recipientAddress,
      ...(includeRead ? {} : { is_read: false }),
    };

    // Get total count for pagination
    const totalCount = await prisma.notification.count({
      where,
    });

    // Query notifications with sender information using proper Prisma.sql syntax
    let query;
    
    if (includeRead) {
      // Query for all notifications (read and unread)
      query = Prisma.sql`
        SELECT n.*, 
               u.username as sender_username, 
               u.display_name as sender_display_name,
               u.avatar_url as sender_avatar_url
        FROM notifications n
        LEFT JOIN users u ON n.sender_address = u.wallet_address
        WHERE n.recipient_address = ${recipientAddress}
        ORDER BY n.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Query for only unread notifications
      query = Prisma.sql`
        SELECT n.*, 
               u.username as sender_username, 
               u.display_name as sender_display_name,
               u.avatar_url as sender_avatar_url
        FROM notifications n
        LEFT JOIN users u ON n.sender_address = u.wallet_address
        WHERE n.recipient_address = ${recipientAddress}
        AND n.is_read = false
        ORDER BY n.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }
    
    const rawNotifications = await prisma.$queryRaw<any[]>(query);

    // Assemble Notification response with formatted text
    const notifications = await Promise.all(rawNotifications.map(async (notification) => {
      // Get sender name for formatting
      const senderName = notification.sender_display_name || 
                       notification.sender_username || 
                       (notification.sender_address ? `${notification.sender_address.substring(0, 8)}...` : 'Unknown');
      
      // For comment notifications, get the comment content
      let contentPreview = '';
      if (notification.type === NotificationType.COMMENT) {
        contentPreview = notification.text;
      }
      
      // Format notification text
      const formattedText = formatNotificationText(
        notification.type,
        senderName,
        contentPreview
      );
      
      return {
        ...notification,
        formatted_text: formattedText,
        sender: notification.sender_address ? {
          wallet_address: notification.sender_address,
          username: notification.sender_username,
          display_name: notification.sender_display_name,
          avatar_url: notification.sender_avatar_url
        } : null,
      };
    }));

    return NextResponse.json({
      data: notifications,
      pagination: {
        total: totalCount,
        offset,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, is_read } = body;

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { is_read: is_read ?? true },
    });

    return NextResponse.json({ data: updatedNotification });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const recipientAddress = searchParams.get('recipientAddress');

    if (!id && !recipientAddress) {
      return NextResponse.json({ error: 'Either ID or recipient address is required' }, { status: 400 });
    }

    if (id) {
      // Delete a single notification
      await prisma.notification.delete({
        where: { id },
      });
    } else {
      // Delete all notifications for a user
      await prisma.notification.deleteMany({
        where: { recipient_address: recipientAddress },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification(s):', error);
    return NextResponse.json({ error: 'Failed to delete notification(s)' }, { status: 500 });
  }
}
