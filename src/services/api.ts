import { NotificationType as PrismaNotificationType } from '@prisma/client';

// Export NotificationType from Prisma client
export { PrismaNotificationType as NotificationType };

export interface Notification {
  id: string;
  recipient_address: string;
  sender_address?: string;
  post_id?: string;
  comment_id?: string;
  type: PrismaNotificationType;
  text: string;
  formatted_text?: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    wallet_address: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

// Post types
export interface Post {
  id: string;
  author_address: string;
  content: string;
  media_url: string[];
  transaction_hash?: string;
  created_at: string;
  updated_at: string;
  author: {
    wallet_address: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  likes: Array<{ user_address: string }>;
  comments: Array<{
    id: string;
    content: string;
    author: {
      wallet_address: string;
      username?: string;
      display_name?: string;
    };
    created_at: string;
  }>;
  tags: Array<{ tag_name: string }>;
}

// API functions
export const api = {
  posts: {
    list: async (myAddress?: string): Promise<Post[]> => {
      const url = myAddress ? `/api/posts?myAddress=${myAddress}` : '/api/posts';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },

    create: async (data: {
      author_address: string;
      content: string;
      media_url?: string[];
      tags?: string[];
      is_unfollow?: boolean;
      transaction_hash?: string;
    }): Promise<Post> => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    },

    like: async (postId: string, data: { 
      user_address: string;
      transaction_hash?: string;
    }) => {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to like post');
      return response.json();
    },

    unlike: async (postId: string, data: any) => {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },

    collect: async (postId: string, data: { 
      user_address: string;
      transaction_hash?: string;
    }) => {
      const response = await fetch(`/api/posts/${postId}/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to collect post');
      return response.json();
    },

    uncollect: async (postId: string, data: any) => {
      const response = await fetch(`/api/posts/${postId}/collect`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },

    getComments: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}/comments`);
      return response.json();
    },

    createComment: async (postId: string, data: any) => {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  },

  users: {
    list: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    
    getMyPosts: async (address: string) => {
      try {
        const response = await fetch(`/api/users/${address}/my-posts`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching user posts:', error);
        throw error;
      }
    },
  
    getFriendsPosts: async (address: string) => {
      try {
        const response = await fetch(`/api/users/${address}/friends-posts`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching friends posts:', error);
        throw error;
      }
    },
  
    getProfile: async (address: string, requestingUserAddress?: string) => {
      const url = new URL(`/api/users/${address}`, window.location.origin);
      if (requestingUserAddress) {
        url.searchParams.set('requestingUserAddress', requestingUserAddress);
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return response.json();
    },

    updateProfile: async (address: string, data: {
      username?: string;
      display_name?: string;
      bio?: string;
      gender?: 'MALE' | 'FEMALE';
      avatar_url?: string;
      avatar_real_url?: string;
    }) => {
      const response = await fetch(`/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: address,
          ...data,
        }),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    follow: async (followerAddress: string, followingAddress: string) => {
      const response = await fetch(`/api/users/${followingAddress}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ follower_address: followerAddress }),
      });
      return response.json();
    },
    unfollow: async (followerAddress: string, followingAddress: string) => {
      const response = await fetch(`/api/users/${followingAddress}/follow?follower_address=${followerAddress}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    checkFollowing: async (followerAddress: string, followingAddress: string) => {
      const response = await fetch(`/api/users/${followingAddress}/follow?follower_address=${followerAddress}`);
      const data = await response.json();
      return data.isFollowing;
    },
    
    getLikedPosts: async (address: string) => {
      const response = await fetch(`/api/users/${address}/liked-posts`);
      if (!response.ok) throw new Error('Failed to fetch liked posts');
      return response.json();
    },
    
    getCollectedPosts: async (address: string) => {
      const response = await fetch(`/api/users/${address}/collected-posts`);
      if (!response.ok) throw new Error('Failed to fetch collected posts');
      return response.json();
    },
  },

  notifications: {
    list: async (recipientAddress: string, options?: { limit?: number; offset?: number; includeRead?: boolean }): Promise<{ data: Notification[]; pagination: { total: number; offset: number; limit: number } }> => {
      const params = new URLSearchParams();
      params.append('recipientAddress', recipientAddress);
      
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.includeRead !== undefined) params.append('includeRead', options.includeRead.toString());
      
      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    
    markAsRead: async (id: string): Promise<Notification> => {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_read: true }),
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      const result = await response.json();
      return result.data;
    },
    
    delete: async (id: string): Promise<void> => {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
    },
    
    deleteAll: async (recipientAddress: string): Promise<void> => {
      const response = await fetch(`/api/notifications?recipientAddress=${recipientAddress}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notifications');
    },
  },
  
  messages: {
    send: async (data: { senderAddress: string; recipientAddress: string; message: string }): Promise<Notification> => {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send message');
      const result = await response.json();
      return result.data;
    },
    
    getConversation: async (user1: string, user2: string, options?: { limit?: number; offset?: number }): Promise<{ data: Notification[]; pagination: { total: number; offset: number; limit: number } }> => {
      const params = new URLSearchParams();
      params.append('user1', user1);
      params.append('user2', user2);
      
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      
      const response = await fetch(`/api/messages?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
  },

  userFiles: {
    list: async (userAddress: string) => {
      const response = await fetch(`/api/user-files?userAddress=${userAddress}`);
      if (!response.ok) throw new Error('Failed to fetch user files');
      return response.json();
    },

    create: async (data: {
      userAddress: string;
      fileName: string;
      fileType: string;
    }) => {
      const response = await fetch('/api/user-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create user file');
      return response.json();
    },

    delete: async (fileId: string) => {
      const response = await fetch(`/api/user-files?fileId=${fileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete user file');
      return response.json();
    },
  },
};
