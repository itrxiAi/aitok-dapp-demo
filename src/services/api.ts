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
    list: async (): Promise<Post[]> => {
      const response = await fetch('/api/posts');
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
  },

  notifications: {
    list: async (userAddress: string): Promise<any[]> => {
      const response = await fetch(`/api/notifications?userAddress=${userAddress}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
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
