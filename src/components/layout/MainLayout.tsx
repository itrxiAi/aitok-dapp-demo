'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { Layout, Menu, Avatar, Typography, Button, Tabs } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  CompassOutlined,
  BellOutlined,
  PlusCircleOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  FireOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';

const { Content } = Layout;
const { Text } = Typography;

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

const CustomWalletButton = () => {
  const { publicKey, disconnect } = useWallet();
  const { walletAddress, user } = useAuth();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleClick = () => {
    if (publicKey) {
      disconnect();
    } else {
      // When not connected, show the default WalletMultiButton's modal
      const walletButton = document.querySelector('.wallet-adapter-button-trigger');
      if (walletButton instanceof HTMLElement) {
        walletButton.click();
      }
    }
  };

  return (
    <>
      <div 
        onClick={handleClick}
        style={{ 
          padding: '8px 16px',
          background: '#fff',
          borderRadius: '20px',
          border: '1px solid #e6e6e6',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          width: '200px',
          minWidth: '200px',
          maxWidth: '200px'
        }}
      >
        <Avatar 
          size={32}
          src={user?.avatar_url}
          icon={!user?.avatar_url && <UserOutlined />}
          style={{ 
            backgroundColor: user?.avatar_url ? undefined : '#4F46E5',
            objectFit: 'cover',
            flexShrink: 0
          }}
        />
        <Text 
          style={{ 
            color: '#000',
            flexGrow: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }} 
        >
          {user?.display_name || (walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Connect Wallet')}
        </Text>
      </div>
      <div style={{ display: 'none' }}>
        <WalletMultiButton />
      </div>
    </>
  );
};

const topTabItems = [
  {
    key: '/explore',
    icon: <CompassOutlined />,
    label: 'Explore',
  },
  {
    key: '/following',
    icon: <TeamOutlined />,
    label: 'Following',
  },
  {
    key: '/recommend',
    icon: <FireOutlined />,
    label: 'Recommend',
  },
];

// Redirect mapping for navigation
const redirects: Record<string, string> = {
  '/': '/recommend',
};

const bottomMenuItems = [
  {
    key: '/recommend',
    icon: <HomeOutlined />,
    label: 'Home',
  },
  {
    key: '/friends',
    icon: <UsergroupAddOutlined />,
    label: 'Friend',
  },
  {
    key: '/create',
    icon: <PlusCircleOutlined />,
    label: 'Post+',
  },
  {
    key: '/notifications',
    icon: <BellOutlined />,
    label: 'Notification',
  },
  {
    key: '/profile',
    icon: <UserOutlined />,
    label: 'Profile',
  },
];

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { publicKey } = useWallet();
  const { isAuthenticated, walletAddress } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Update menu items to include wallet address in profile link
  const getBottomMenuItems = () => {
    return bottomMenuItems.map(item => {
      if (item.key === '/users/me' && walletAddress) {
        return {
          ...item,
          key: `/users/${walletAddress}`,
        };
      }
      return item;
    });
  };
  
  const getTopTabItems = () => {
    return topTabItems.map(item => {
      if (item.key === '/following' && walletAddress) {
        return {
          ...item,
          key: `/users/${walletAddress}/following`,
        };
      }
      return item;
    });
  };

  const handleCreatePost = () => {
    router.push('/create');
  };

  const renderTopTabs = () => (
    <div
      style={{
        position: 'fixed',
        top: '60px',
        left: 0,
        right: 0,
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        zIndex: 999,
        padding: '0 10px',
      }}
    >
      <Tabs
        items={getTopTabItems().map((item) => ({
          key: item.key,
          label: (
            <Link href={item.key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ),
        }))}
        activeKey={pathname}
        centered
        size="large"
      />
    </div>
  );

  const renderBottomNav = () => (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        zIndex: 1000,
      }}
    >
      <Menu
        mode="horizontal"
        selectedKeys={[pathname]}
        style={{
          display: 'flex',
          justifyContent: 'space-around',
        }}
        items={getBottomMenuItems().map((item) => ({
          key: item.key,
          icon: item.key === '/create' ? null : item.icon,
          label: item.key === '/create' ? (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={handleCreatePost}
              style={{
                borderRadius: '50%',
                backgroundColor: '#FF2C55',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                height: '40px',
                width: '40px',
                fontSize: '15px'
              }}
            />
          ) : (
            <Link href={item.key} style={{ fontSize: '12px' }}>{item.label}</Link>
          )
        }))}
      />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', maxWidth: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '12px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>STEM</div>
        <CustomWalletButton />
      </div>
      {renderTopTabs()}

      <Layout style={{ 
        background: '#fff',
        width: '100%'
      }}>
        <Content style={{ 
          padding: 0,
          minHeight: 280,
          background: '#fff'
        }}>
          <div style={{ 
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto',
            paddingTop: '110px',
            paddingBottom: '70px',
          }}>
            {children}
          </div>
        </Content>
        {renderBottomNav()}
      </Layout>
    </Layout>
  );
};

export default MainLayout;
