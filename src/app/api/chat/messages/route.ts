import { NextRequest, NextResponse } from 'next/server';
import { chatStore, MessageType } from '@/lib/chatStore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const messages = chatStore.getMessages(conversationId);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { conversationId, senderAddress, content, mediaUrl, messageType } = await request.json();

    if (!conversationId || !senderAddress) {
      return NextResponse.json(
        { error: 'Conversation ID and sender address are required' },
        { status: 400 }
      );
    }

    if (!content && !mediaUrl) {
      return NextResponse.json(
        { error: 'Message content or media URL is required' },
        { status: 400 }
      );
    }

    const message = chatStore.addMessage(
      conversationId,
      senderAddress,
      content,
      mediaUrl,
      messageType as MessageType || 'text'
    );

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { conversationId, userAddress } = await request.json();

    if (!conversationId || !userAddress) {
      return NextResponse.json(
        { error: 'Conversation ID and user address are required' },
        { status: 400 }
      );
    }

    chatStore.markAsRead(conversationId, userAddress);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
