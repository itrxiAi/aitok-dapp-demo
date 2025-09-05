'use client';

import { useEffect, useState } from 'react';
import { api, Post as ApiPost } from '@/services/api';
import { Post } from '@/components/Post';
import { ContentListPage } from '@/components/ContentListPage';

export default function RecommendPage() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

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

  const renderPost = (post: ApiPost) => (
    <Post key={post.id} post={post} onUpdate={fetchPosts} />
  );

  return (
    <ContentListPage
      title="Recommended Content"
      data={posts}
      loading={loading}
      emptyMessage="No recommended content available"
      notConnectedMessage="Please connect your wallet to see recommended content"
      renderItem={renderPost}
      fetchData={fetchPosts}
      padding="0 8px"
    />
  );
}
