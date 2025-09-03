'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Card, List } from 'antd';
import { useEffect, useState } from 'react';
import { api, Post as ApiPost } from '@/services/api';
import { Post } from '@/components/Post';

export default function RecommendPage() {
  const { publicKey } = useWallet();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [publicKey]);

  const fetchPosts = async () => {
    try {
      // For now, we're using the same API as the home page
      // In a real app, this would be a different API endpoint for recommended posts
      const fetchedPosts = await api.posts.list();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching recommended posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <Card>
        <h1>Recommended Content</h1>
        <p>Please connect your wallet to see recommended content</p>
      </Card>
    );
  }

  return (
    <div style={{ width: '100%', padding: '0 8px' }}>
      <List
        loading={loading}
        itemLayout="vertical"
        size="large"
        dataSource={posts}
        renderItem={(post) => (
          <Post key={post.id} post={post} onUpdate={fetchPosts} />
        )}
      />
    </div>
  );
}
