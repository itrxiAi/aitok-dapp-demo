// Chat storage - server-side in-memory

export type MessageType = 'text' | 'image' | 'voice';

export interface Message {
  id: string;
  conversationId: string;
  senderAddress: string;
  content?: string;
  mediaUrl?: string;
  messageType: MessageType;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participant1: string;
  participant2?: string;
  participants?: string[]; // For group chats
  groupName?: string; // For group chats
  isGroup?: boolean;
  lastMessageAt: string;
  createdAt: string;
}

class ChatStore {
  private conversations: Map<string, Conversation> = new Map();
  private messages: Map<string, Message[]> = new Map();

  constructor() {
    // Server-side in-memory storage
  }

  getConversationId(user1: string, user2: string): string {
    const [addr1, addr2] = [user1, user2].sort();
    return `${addr1}_${addr2}`;
  }

  getOrCreateConversation(participant1: string, participant2: string): Conversation {
    const id = this.getConversationId(participant1, participant2);
    
    if (!this.conversations.has(id)) {
      const conversation: Conversation = {
        id,
        participant1,
        participant2,
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      this.conversations.set(id, conversation);
      this.messages.set(id, []);
    }

    return this.conversations.get(id)!;
  }

  createGroupConversation(groupName: string, participants: string[], creator: string): Conversation {
    const id = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const allParticipants = [creator, ...participants.filter(p => p !== creator)];
    
    const conversation: Conversation = {
      id,
      participant1: creator,
      participants: allParticipants,
      groupName,
      isGroup: true,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    console.log('Creating group conversation:', {
      id,
      groupName,
      allParticipants,
      creator
    });
    
    this.conversations.set(id, conversation);
    this.messages.set(id, []);
    
    return conversation;
  }

  getConversations(userAddress: string): Conversation[] {
    const userConversations: Conversation[] = [];
    
    this.conversations.forEach((conv) => {
      if (conv.isGroup) {
        // Group chat: check if user is in participants
        if (conv.participants?.includes(userAddress)) {
          userConversations.push(conv);
        }
      } else {
        // Private chat: check participant1 or participant2
        if (conv.participant1 === userAddress || conv.participant2 === userAddress) {
          userConversations.push(conv);
        }
      }
    });

    return userConversations.sort((a, b) => 
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  addMessage(
    conversationId: string,
    senderAddress: string,
    content?: string,
    mediaUrl?: string,
    messageType: MessageType = 'text'
  ): Message {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 12)}_${performance.now()}`,
      conversationId,
      senderAddress,
      content,
      mediaUrl,
      messageType,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    const conversationMessages = this.messages.get(conversationId) || [];
    conversationMessages.push(message);
    this.messages.set(conversationId, conversationMessages);

    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.lastMessageAt = new Date().toISOString();
    }

    return message;
  }

  getMessages(conversationId: string): Message[] {
    return this.messages.get(conversationId) || [];
  }

  markAsRead(conversationId: string, userAddress: string): void {
    const messages = this.messages.get(conversationId) || [];
    messages.forEach(msg => {
      if (msg.senderAddress !== userAddress) {
        msg.isRead = true;
      }
    });
  }

  getUnreadCount(conversationId: string, userAddress: string): number {
    const messages = this.messages.get(conversationId) || [];
    return messages.filter(msg => 
      msg.senderAddress !== userAddress && !msg.isRead
    ).length;
  }
}

// Use global to preserve instance across hot reloads in development
const globalForChatStore = global as typeof globalThis & {
  chatStore?: ChatStore;
};

export const chatStore = globalForChatStore.chatStore ?? new ChatStore();

if (process.env.NODE_ENV !== 'production') {
  globalForChatStore.chatStore = chatStore;
}