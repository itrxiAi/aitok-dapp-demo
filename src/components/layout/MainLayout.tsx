'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { Layout, Menu, Avatar, Typography, Button } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  CompassOutlined,
  BellOutlined,
  PlusCircleOutlined,
  TeamOutlined,
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

const menuItems = [
  {
    key: '/',
    icon: <HomeOutlined />,
    label: 'Home',
  },
  {
    key: '/explore',
    icon: <CompassOutlined />,
    label: 'Explore',
  },
  {
    key: '/notifications',
    icon: <BellOutlined />,
    label: 'Notifications',
  },
  {
    key: '/profile',
    icon: <UserOutlined />,
    label: 'Profile',
  },
  {
    key: '/following',
    icon: <TeamOutlined />,
    label: 'Following',
  },
  {
    key: '/create',
    icon: <PlusCircleOutlined />,
    label: 'Create Post',
  },
];

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { publicKey } = useWallet();
  const { isAuthenticated, walletAddress } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Update menu items to include wallet address in profile link
  const getMenuItems = () => {
    return menuItems.map(item => {
      if (item.key === '/users/me' && walletAddress) {
        return {
          ...item,
          key: `/users/${walletAddress}`,
        };
      }
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

  const renderMobileNav = () => (
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
        items={getMenuItems().map((item) => ({
          key: item.key,
          icon: item.key === '/create' ? null : item.icon,
          label: item.key === '/create' ? (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={handleCreatePost}
              style={{
                borderRadius: '20px',
                backgroundColor: '#4F46E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 12px',
                height: '32px',
                fontSize: '15px'
              }}
            >
              Post
            </Button>
          ) : (
            <Link href={item.key} style={{ fontSize: '15px' }}>{item.label}</Link>
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
        justifyContent: 'flex-end'
      }}>
        <CustomWalletButton />
      </div>

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
            paddingTop: '60px',
            paddingBottom: '60px',
          }}>
            {children}
          </div>
        </Content>
        {renderMobileNav()}
      </Layout>
    </Layout>
  );
};

export default MainLayout;
