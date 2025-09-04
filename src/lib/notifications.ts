import { prisma } from '@/lib/prisma';
import { NotificationType } from '@/services/api';

/**
 * Creates a notification in the database
 * 
 * @param recipientAddress - The wallet address of the user receiving the notification
 * @param senderAddress - The wallet address of the user triggering the notification (optional)
 * @param type - The type of notification (FOLLOW, LIKE, COMMENT, MESSAGE)
 * @param text - The text to display in the notification
 * @param postId - The ID of the related post (optional)
 * @param commentId - The ID of the related comment (optional)
 * @returns The created notification
 */
export async function createNotification({
  recipientAddress,
  senderAddress,
  type,
  text,
  postId,
  commentId,
}: {
  recipientAddress: string;
  senderAddress?: string;
  type: NotificationType;
  text: string;
  postId?: string;
  commentId?: string;
}) {
  try {
    // Don't create notifications if the sender is the recipient
    if (senderAddress && senderAddress === recipientAddress) {
      return null;
    }

    // Create the notification using Prisma client
    const result = await prisma.notification.create({
      data: {
        recipient_address: recipientAddress,
        sender_address: senderAddress,
        post_id: postId,
        comment_id: commentId,
        type,
        text,
        is_read: false,
      }
    });

    return result;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Formats a notification text based on the type and sender
 * 
 * @param type - The notification type
 * @param senderName - The name of the sender (username or display_name or wallet address)
 * @param contentPreview - Optional content preview (for comments)
 * @returns Formatted notification text
 */
export function formatNotificationText(
  type: NotificationType,
  senderName: string,
  contentPreview?: string
): string {
  switch (type) {
    case NotificationType.FOLLOW:
      return `${senderName} started following you`;
    case NotificationType.LIKE:
      return `${senderName} liked your post`;
    case NotificationType.COMMENT:
      return `${senderName} commented on your post`;
    case NotificationType.MESSAGE:
      if (contentPreview) {
        // Truncate message content if it's too long
        const preview = contentPreview.length > 50 
          ? `${contentPreview.substring(0, 47)}...` 
          : contentPreview;
        return `${senderName} sent you a message: "${preview}"`;
      }
      return `${senderName} sent you a message`;
    default:
      return `You have a new notification`;
  }
}
