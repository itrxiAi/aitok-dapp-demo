'use client';

import { Card, List, Typography, Space } from 'antd';
import { NumberOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface TrendingTopic {
  id: string;
  category: string;
  title: string;
  posts: string;
}

export const TrendingNews = () => {
  // This would typically come from an API
  const trendingTopics: TrendingTopic[] = [
    {
      id: '1',
      category: 'Technology',
      title: 'Web3 Development',
      posts: '2.5M posts',
    },
    {
      id: '2',
      category: 'Cryptocurrency',
      title: 'Solana',
      posts: '223K posts',
    },
    {
      id: '3',
      category: 'NFT',
      title: 'Digital Art',
      posts: '150K posts',
    },
    {
      id: '4',
      category: 'DeFi',
      title: 'Decentralized Finance',
      posts: '89K posts',
    },
    {
      id: '5',
      category: 'Gaming',
      title: 'GameFi',
      posts: '45K posts',
    },
  ];

  return (
    <Card
      title={<Title level={4}>What's happening</Title>}
      variant="borderless"
      style={{ marginTop: 16 }}
    >
      <List
        itemLayout="vertical"
        dataSource={trendingTopics}
        renderItem={(item) => (
          <List.Item
            key={item.id}
            style={{ cursor: 'pointer', padding: '12px 0' }}
            onClick={() => {}}
          >
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {item.category}
              </Text>
              <Text strong style={{ fontSize: '15px' }}>
                {item.title}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {item.posts}
              </Text>
            </Space>
          </List.Item>
        )}
      />
    </Card>
  );
};
