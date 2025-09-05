'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Avatar, Typography, Button, message, Space, List } from 'antd';
import { UserOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import { ContentListPage } from '@/components/ContentListPage';

const { Text } = Typography;

interface User {
  wallet_address: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  _count: {
    followers: number;
  };
}

export default function Friends() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBios, setExpandedBios] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (publicKey) {
      fetchFriends();
    }
  }, [publicKey]);

  const fetchFriends = async () => {
    if (!publicKey) return;

    try {
      // This would be a different endpoint in a real app
      const response = await fetch(`/api/users/${publicKey.toBase58()}/friends`);
      const data = await response.json();
      setFriends(data);
    } catch (error) {
      console.error('Error fetching friends:', error);
      message.error('Failed to fetch friends list');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfriend = async (address: string) => {
    if (!publicKey) return;

    try {
      // This would be a different API call in a real app
      await api.users.unfollow(publicKey.toBase58(), address);
      message.success('Removed friend successfully');
      fetchFriends();
    } catch (error) {
      console.error('Error removing friend:', error);
      message.error('Failed to remove friend');
    }
  };

  const toggleBio = (address: string) => {
    setExpandedBios(prev => ({
      ...prev,
      [address]: !prev[address]
    }));
  };

  const renderUser = (user: User) => (
    <List.Item>
      <List.Item.Meta
        avatar={
          <Avatar 
            icon={<UserOutlined />} 
            src={user.avatar_url}
            style={{ cursor: 'pointer' }}
            onClick={() => router.push(`/users/${user.wallet_address}`)}
          />
        }
        title={
          <div>
            <a onClick={() => router.push(`/users/${user.wallet_address}`)}>
              {user.display_name || user.username || `${user.wallet_address.slice(0, 4)}...${user.wallet_address.slice(-4)}`}
            </a>
            <Space style={{ marginLeft: 16, fontSize: '0.9em', color: '#666' }}>
              <Text>{user._count?.followers || 0} Followers</Text>
              <Button 
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnfriend(user.wallet_address);
                }}
                style={{ 
                  border: '1px solid rgb(207, 217, 222)',
                  borderRadius: '16px',
                  height: '28px',
                  padding: '0 12px',
                  color: 'rgb(83, 100, 113)',
                  fontWeight: 400,
                  fontSize: '13px',
                  background: 'white'
                }}
              >
                Remove Friend
              </Button>
            </Space>
          </div>
        }
        description={
          user.bio && (
            <div>
              <div style={{ 
                marginTop: 4,
                position: 'relative',
                maxHeight: expandedBios[user.wallet_address] ? 'none' : '44px',
                overflow: 'hidden'
              }}>
                {user.bio}
              </div>
              {user.bio.length > 100 && (
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => toggleBio(user.wallet_address)}
                  style={{ padding: 0, height: 'auto', marginTop: 4 }}
                >
                  {expandedBios[user.wallet_address] ? (
                    <Space>
                      <span>Show less</span>
                      <UpOutlined style={{ fontSize: '12px' }} />
                    </Space>
                  ) : (
                    <Space>
                      <span>Show more</span>
                      <DownOutlined style={{ fontSize: '12px' }} />
                    </Space>
                  )}
                </Button>
              )}
            </div>
          )
        }
      />
    </List.Item>
  );

  return (
    <ContentListPage
      title="Friends"
      data={friends}
      loading={loading}
      emptyMessage="You don't have any friends yet"
      notConnectedMessage="Please connect your wallet to view your friends list"
      renderItem={renderUser}
      fetchData={fetchFriends}
    />
  );
}
