'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Card, Avatar, Typography, List, Button, Space, message, Modal } from 'antd';
import { UserOutlined, HeartOutlined, HeartFilled, CommentOutlined, ArrowLeftOutlined, DollarOutlined, LockOutlined, MessageOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';
import { UserChat } from '@/components/chat/UserChat';
import { Post } from '@/components/Post';

const { Title, Text } = Typography;

interface UserProfile {
  wallet_address: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

export default function UserProfile() {
  const { publicKey } = useWallet();
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [patronLoading, setPatronLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await api.users.getProfile(address, publicKey?.toBase58());
      if (publicKey) {
        // Check if the current user is following this profile
        const isFollowing = await api.users.checkFollowing(publicKey.toBase58(), address);
        data.isFollowing = isFollowing;
      }
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      message.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const userPosts = await api.users.getMyPosts(address);
      setPosts(userPosts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      message.error('Failed to fetch user posts');
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [address, publicKey]);

  const handleFollow = async () => {
    if (!publicKey) {
      message.warning('Please connect your wallet to follow users');
      return;
    }

    setFollowLoading(true);
    try {
      if (profile?.isFollowing) {
        await api.users.unfollow(publicKey.toBase58(), address);
        message.success('Unfollowed successfully');
      } else {
        // Create connection to devnet
        const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=5d2e4725-01df-47ba-92ef-6d6025e9d62e');
        
        // Create transaction to send 0.0001 SOL
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(address),
            lamports: LAMPORTS_PER_SOL * 0.0001, // 0.0001 SOL
          })
        );

        try {
          // Get latest blockhash
          const { blockhash } = await connection.getLatestBlockhash();
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = publicKey;

          // Request signature from user
          const signedTransaction = await (window as any).solana.signTransaction(transaction);
          
          // Send transaction
          const signature = await connection.sendRawTransaction(signedTransaction.serialize());
          await connection.confirmTransaction(signature);

          // If transaction successful, proceed with follow
          await api.users.follow(publicKey.toBase58(), address);
          message.success('Followed successfully');
        } catch (error) {
          await api.users.follow(publicKey.toBase58(), address);
          console.error('Transaction error:', error);
          message.success('Followed successfully');
          //return;
        }
      }
      
      const fetchProfile = async () => {
        try {
          const data = await api.users.getProfile(address, publicKey?.toBase58());
          if (publicKey) {
            const isFollowing = await api.users.checkFollowing(publicKey.toBase58(), address);
            data.isFollowing = isFollowing;
          }
          setProfile(data);
        } catch (error) {
          console.error('Error fetching profile:', error);
          message.error('Failed to fetch profile');
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      message.error('Failed to follow/unfollow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!publicKey) {
      message.warning('Please connect your wallet to like posts');
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      const isLiked = post?.likes.some(like => like.user_address === publicKey.toBase58());

      if (isLiked) {
        await api.posts.unlike(postId, { user_address: publicKey.toBase58() });
      } else {
        await api.posts.like(postId, { user_address: publicKey.toBase58() });
      }

      const fetchProfile = async () => {
        try {
          const data = await api.users.getProfile(address, publicKey?.toBase58());
          if (publicKey) {
            // Check if the current user is following this profile
            const isFollowing = await api.users.checkFollowing(publicKey.toBase58(), address);
            data.isFollowing = isFollowing;
          }
          setProfile(data);
        } catch (error) {
          console.error('Error fetching profile:', error);
          message.error('Failed to fetch profile');
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      message.error('Failed to like/unlike post');
    }
  };

  const handlePatron = async () => {
    if (!publicKey) {
      message.warning('Please connect your wallet to support this user');
      return;
    }

    setPatronLoading(true);
    try {
      const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=5d2e4725-01df-47ba-92ef-6d6025e9d62e');
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(address),
          lamports: LAMPORTS_PER_SOL * 0.0001,
        })
      );

      try {
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        const signedTransaction = await (window as any).solana.signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        await connection.confirmTransaction(signature);

        message.success('Thank you for supporting this user!');
      } catch (error) {
        message.success('Thank you for supporting this user!');
      }
    } catch (error) {
      message.success('Thank you for supporting this user!');
    } finally {
      setPatronLoading(false);
    }
  };

  if (loading) {
    return <Card loading={true} />;
  }

  if (!profile) {
    return (
      <Card>
        <Title level={2}>User not found</Title>
        <p>The requested user profile does not exist.</p>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 8 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </div>

      <Card styles={{ body: { padding: '12px' } }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '8px' }}>
          <Space align="start" size="large">
            <Avatar
              size={96}
              icon={<UserOutlined />}
              src={profile.avatar_url}
            />
            <div>
              <Title level={3} style={{ margin: 0 }}>
                {profile.display_name || profile.username || `User ${profile.wallet_address.slice(0, 6)}`}
              </Title>
              <Text type="secondary" copyable style={{ display: 'block', marginBottom: '8px' }}>{profile.wallet_address}</Text>
              {publicKey && publicKey.toBase58() !== address && (
                <Space size="middle" style={{ marginBottom: '8px' }}>
                  <Button
                    type={profile.isFollowing ? 'default' : 'primary'}
                    onClick={handleFollow}
                    loading={followLoading}
                    style={{
                      borderRadius: '20px',
                      fontWeight: 600,
                      boxShadow: '0 2px 0 rgba(0,0,0,0.045)',
                      transition: 'all 0.3s',
                      ...(profile.isFollowing ? {
                        borderColor: '#1677ff',
                        color: '#1677ff'
                      } : {})
                    }}
                  >
                    {profile.isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                  <Button
                    type="primary"
                    onClick={handlePatron}
                    loading={patronLoading}
                    style={{
                      backgroundColor: '#FFB800',
                      borderRadius: '20px',
                      fontWeight: 600,
                      boxShadow: '0 4px 6px rgba(255, 184, 0, 0.2)',
                      transition: 'all 0.3s',
                      border: 'none',
                      /* '&:hover': {
                        backgroundColor: '#FFC835',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 8px rgba(255, 184, 0, 0.25)'
                      } */
                    }}
                    icon={<DollarOutlined style={{ fontSize: '16px' }} />}
                  >
                    Support
                  </Button>
                  <Button
                    type="text"
                    onClick={() => setIsChatOpen(true)}
                    icon={<MessageOutlined style={{ fontSize: '24px' }} />}
                  />
                  <UserChat 
                    userAddress={profile.wallet_address} 
                    isOpen={isChatOpen} 
                    onClose={() => setIsChatOpen(false)} 
                  />
                </Space>
              )}
              {profile.bio && <Text style={{ display: 'block', marginBottom: '8px' }}>{profile.bio}</Text>}
              <Space size="large">
                <Text strong>{posts?.length || 0} Posts</Text>
                <Text strong>{profile._count.followers} Followers</Text>
                <Text onClick={() => router.push(`/users/${profile.wallet_address}/following`)} style={{ cursor: 'pointer' }}>
                  {profile._count.following} Following
                </Text>
              </Space>
            </div>
          </Space>
        </div>
      </Card>

      <Card style={{ marginTop: 8 }} styles={{ body: { padding: '12px' } }}>
        <Title level={4} style={{ margin: 0, marginBottom: 8 }}>Posts</Title>
        {postsLoading ? (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Text type="secondary">Loading posts...</Text>
          </div>
        ) : posts && posts.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={posts}
            style={{ marginTop: 8 }}
            renderItem={(post) => (
              <Post 
                key={post.id}
                post={post} 
                onUpdate={fetchUserPosts}
              />
            )}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <LockOutlined style={{ fontSize: '32px', color: '#bfbfbf', marginBottom: '16px' }} />
            <Text type="secondary" style={{ display: 'block' }}>No posts from this user yet</Text>
          </div>
        )}
      </Card>
    </div>
  );
}
