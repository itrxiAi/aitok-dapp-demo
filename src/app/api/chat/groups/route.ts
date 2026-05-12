import { NextRequest, NextResponse } from 'next/server';
import { chatStore } from '@/lib/chatStore';

export async function POST(request: NextRequest) {
  try {
    const { groupName, members, creator } = await request.json();

    if (!groupName || !members || !creator) {
      return NextResponse.json(
        { error: 'Group name, members, and creator are required' },
        { status: 400 }
      );
    }

    const conversation = chatStore.createGroupConversation(groupName, members, creator);

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    );
  }
}
