'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { List, Typography, Card, Space, Avatar, Button, Empty } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import { UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Notification {
  id: string;
  type: 'new_post';
  actor_address: string;
  actor: {
    wallet_address: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    content: string;
  };
  created_at: string;
  read: boolean;
}

export default function Notifications() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [publicKey]);

  const fetchNotifications = async () => {
    if (!publicKey) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      const data = await api.notifications.list(publicKey.toBase58());
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.type === 'new_post' && notification.post) {
      router.push(`/users/${notification.actor_address}#post-${notification.post.id}`);
    }
  };

  if (!publicKey) {
    return (
      <Card>
        <Empty
          description="Connect your wallet to see notifications"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card>
      <List
        loading={loading}
        itemLayout="horizontal"
        dataSource={notifications}
        locale={{
          emptyText: <Empty description="No notifications yet" />
        }}
        renderItem={(notification) => (
          <List.Item
            style={{
              cursor: 'pointer',
              backgroundColor: notification.read ? undefined : 'rgba(24, 144, 255, 0.05)',
            }}
            onClick={() => handleNotificationClick(notification)}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={40}
                  icon={<UserOutlined />}
                  src={notification.actor.avatar_url}
                />
              }
              title={
                <Space>
                  <Text strong>
                    {notification.actor.display_name || 
                     notification.actor.username || 
                     `${notification.actor.wallet_address.slice(0, 4)}...${notification.actor.wallet_address.slice(-4)}`}
                  </Text>
                  <Text type="secondary">posted something new</Text>
                </Space>
              }
              description={
                notification.post?.content.length > 100
                  ? `${notification.post.content.slice(0, 100)}...`
                  : notification.post?.content
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
