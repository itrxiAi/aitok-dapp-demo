import { Card, Avatar, Space, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

interface UserCardProps {
  user: {
    wallet_address: string;
    display_name?: string;
    username?: string;
    avatar_url?: string;
    _count: {
      posts: number;
      followers: number;
      following: number;
    };
  };
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter();

  return (
    <Card style={{ marginBottom: 16, cursor: 'pointer' }} onClick={() => router.push(`/users/${user.wallet_address}`)}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Avatar size={48} icon={<UserOutlined />} src={user.avatar_url} />
        <Space direction="vertical" style={{ marginLeft: 16 }}>
          <Text strong>
            {user.display_name || user.username || `${user.wallet_address.slice(0, 4)}...${user.wallet_address.slice(-4)}`}
          </Text>
          <Text type="secondary" copyable>
            {user.wallet_address}
          </Text>
          <Space>
            <Text>{user._count.posts} Posts</Text>
            <Text>{user._count.followers} Followers</Text>
            <Text>{user._count.following} Following</Text>
          </Space>
        </Space>
      </div>
    </Card>
  );
}
