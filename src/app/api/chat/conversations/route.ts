import { NextRequest, NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userAddress = searchParams.get('userAddress');

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      );
    }

    const conversations = chatStore.getConversations(userAddress);

    const conversationsWithUserInfo = await Promise.all(
      conversations.map(async (conv) => {
        let otherUser = null;
        
        if (conv.isGroup) {
          // For group chats, use group name
          otherUser = {
            wallet_address: conv.id,
            display_name: conv.groupName || "群聊",
            username: null,
            avatar_url: null
          };
        } else {
          // For private chats, get other user info
          const otherUserAddress = conv.participant1 === userAddress 
            ? conv.participant2 
            : conv.participant1;
          
          otherUser = await prisma.user.findUnique({
            where: { wallet_address: otherUserAddress },
            select: {
              wallet_address: true,
              username: true,
              display_name: true,
              avatar_url: true
            }
          });
        }

        const messages = chatStore.getMessages(conv.id);
        const lastMessage = messages[messages.length - 1] || null;
        const unreadCount = chatStore.getUnreadCount(conv.id, userAddress);

        return {
          ...conv,
          otherUser,
          lastMessage,
          unreadCount
        };
      })
    );

    return NextResponse.json(conversationsWithUserInfo);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { participant1, participant2 } = await request.json();

    if (!participant1 || !participant2) {
      return NextResponse.json(
        { error: 'Both participants are required' },
        { status: 400 }
      );
    }

    const conversation = chatStore.getOrCreateConversation(participant1, participant2);

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
