'use client';

import { useWallet } from '@/hooks/useWallet';
import { Card, List } from 'antd';
import { useEffect, useState } from 'react';
import { api, Post as ApiPost } from '@/services/api';
import { Post } from '@/components/Post';
import { useAuth } from '@/hooks/useAuth';

export default function FollowingPostsPage() {
  const { publicKey } = useWallet();
  const { walletAddress } = useAuth();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (walletAddress) {
      fetchFollowingPosts();
    }
  }, [walletAddress]);

  const fetchFollowingPosts = async () => {
    try {
      // Fetch posts with userAddress parameter to filter by followed users
      const response = await fetch(`/api/posts?userAddress=${walletAddress}&myAddress=${walletAddress}`);
      if (!response.ok) throw new Error('Failed to fetch following posts');
      
      const fetchedPosts = await response.json();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching following posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <Card>
        <h1>Following Posts</h1>
        <p>Please connect your wallet to see posts from users you follow</p>
      </Card>
    );
  }

  return (
    <div style={{ width: '100%', padding: '0 8px' }}>
      {posts.length === 0 && !loading ? (
        <Card>
          <h2>No posts from followed users</h2>
          <p>Follow some users to see their posts here</p>
        </Card>
      ) : (
        <List
          loading={loading}
          itemLayout="vertical"
          size="large"
          dataSource={posts}
          renderItem={(post) => (
            <Post key={post.id} post={post} onUpdate={fetchFollowingPosts} />
          )}
        />
      )}
    </div>
  );
}
