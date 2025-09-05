'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Card, List, Typography } from 'antd';
import { ReactNode } from 'react';

const { Title } = Typography;

export interface ContentListPageProps<T> {
  title: string;
  data: T[];
  loading: boolean;
  emptyMessage?: string;
  notConnectedMessage?: string;
  renderItem: (item: T) => ReactNode;
  fetchData: () => Promise<void>;
  maxWidth?: number | string;
  padding?: string | number;
}

export function ContentListPage<T>({
  title,
  data,
  loading,
  emptyMessage = 'No content to display',
  notConnectedMessage = 'Please connect your wallet to view content',
  renderItem,
  maxWidth = 800,
  padding = '0 8px',
}: ContentListPageProps<T>) {
  const { publicKey } = useWallet();

  if (!publicKey) {
    return (
      <Card>
        <Title level={2}>{title}</Title>
        <p>{notConnectedMessage}</p>
      </Card>
    );
  }

  if (loading) {
    return <Card loading={true} />;
  }

  return (
    <div style={{ maxWidth, margin: '0 auto', width: '100%', padding }}>
      {title && (
        <Card>
          <Title level={2}>{title}</Title>
          {data.length === 0 && <p>{emptyMessage}</p>}
        </Card>
      )}
      {data.length > 0 && (
        <List
          itemLayout="vertical"
          size="large"
          dataSource={data}
          renderItem={renderItem}
        />
      )}
    </div>
  );
}
