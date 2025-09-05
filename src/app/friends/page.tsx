'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { api, Post as ApiPost } from '@/services/api';
import { Post } from '@/components/Post';
import { ContentListPage } from '@/components/ContentListPage';

const { Text } = Typography;

export default function Friends() {
  const { publicKey } = useWallet();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (publicKey) {
      fetchFriendsPosts();
    }
  }, [publicKey]);

  const fetchFriendsPosts = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      const data = await api.users.getFriendsPosts(publicKey.toBase58());
      setPosts(data);
    } catch (error) {
      console.error('Error fetching friends posts:', error);
      message.error('Failed to fetch posts from friends');
    } finally {
      setLoading(false);
    }
  };

  const renderPost = (post: ApiPost) => (
    <Post key={post.id} post={post} onUpdate={fetchFriendsPosts} />
  );

  return (
    <ContentListPage
      title="Friends' Posts"
      data={posts}
      loading={loading}
      emptyMessage="No posts from your friends yet"
      notConnectedMessage="Please connect your wallet to view posts from your friends"
      renderItem={renderPost}
      fetchData={fetchFriendsPosts}
      padding="0 8px"
    />
  );
}
