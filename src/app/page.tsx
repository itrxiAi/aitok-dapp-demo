'use client';

import { useWallet } from '@/hooks/useWallet';
import { Card, List } from 'antd';
import { useEffect, useState } from 'react';
import { api, Post as ApiPost } from '@/services/api';
import { Post } from '@/components/Post';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { publicKey } = useWallet();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Redirect to recommend page
    router.push('/recommend');
  }, [router]);

  useEffect(() => {
    fetchPosts();
  }, [publicKey]);

  const fetchPosts = async () => {
    try {
      const fetchedPosts = await api.posts.list();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <Card>
        <h1>Welcome to TwinX Social</h1>
        <p>Please connect your wallet to continue</p>
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
