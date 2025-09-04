'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { List, Typography, Card, Space, Avatar, Button, Empty, Badge } from 'antd';
import { useEffect, useState } from 'react';
import { api, Notification, NotificationType } from '@/services/api';
import { useRouter } from 'next/navigation';
import { UserOutlined, CheckOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

export default function Notifications() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, offset: 0, limit: 20 });

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
      setLoading(true);
      const response = await api.notifications.list(publicKey.toBase58(), {
        limit: pagination.limit,
        offset: pagination.offset,
        includeRead: true
      });
      setNotifications(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark notification as read
    if (!notification.is_read) {
      try {
        await api.notifications.markAsRead(notification.id);
        // Update the notification in the local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case NotificationType.FOLLOW:
        router.push(`/users/${notification.sender_address}`);
        break;
      case NotificationType.LIKE:
      case NotificationType.COMMENT:
        if (notification.post_id) {
          router.push(`/posts/${notification.post_id}`);
        }
        break;
      case NotificationType.MESSAGE:
        // For messages, we could navigate to a chat/conversation view
        router.push(`/messages?user=${notification.sender_address}`);
        break;
      default:
        // Default action if type is not recognized
        break;
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if (!publicKey) return;
    
    try {
      await Promise.all(notifications
        .filter(n => !n.is_read)
        .map(n => api.notifications.markAsRead(n.id)));
      
      // Update all notifications in local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const handleClearAll = async () => {
    if (!publicKey) return;
    
    try {
      await api.notifications.deleteAll(publicKey.toBase58());
      setNotifications([]);
      setPagination(prev => ({ ...prev, total: 0 }));
    } catch (error) {
      console.error('Error clearing notifications:', error);
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
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4}>
          Notifications {unreadCount > 0 && <Badge count={unreadCount} style={{ marginLeft: 8 }} />}
        </Title>
        <Space>
          {unreadCount > 0 && (
            <Button type="text" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button type="text" danger onClick={handleClearAll}>
              Clear all
            </Button>
          )}
        </Space>
      </div>
      
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
              backgroundColor: notification.is_read ? undefined : 'rgba(24, 144, 255, 0.05)',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '8px'
            }}
            onClick={() => handleNotificationClick(notification)}
            actions={[
              notification.is_read ? (
                <CheckOutlined style={{ color: '#52c41a' }} />
              ) : (
                <Button 
                  size="small" 
                  type="text"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNotificationClick(notification);
                  }}
                >
                  Mark as read
                </Button>
              )
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  size={40}
                  icon={<UserOutlined />}
                  src={notification.sender?.avatar_url}
                />
              }
              title={
                <Text strong>
                  {notification.sender?.display_name || 
                   notification.sender?.username || 
                   (notification.sender_address ? 
                     `${notification.sender_address.slice(0, 4)}...${notification.sender_address.slice(-4)}` : 
                     'Unknown')}
                </Text>
              }
              description={
                <div>
                  <Text>{notification.formatted_text || notification.text}</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(notification.created_at).toLocaleString()}
                    </Text>
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
