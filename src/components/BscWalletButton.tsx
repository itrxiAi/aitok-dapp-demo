'use client';

import { Button, Dropdown } from 'antd';
import { useBscWallet } from '@/hooks/useBscWallet';
import { useEffect, useState } from 'react';
import { WalletOutlined, DisconnectOutlined } from '@ant-design/icons';

interface BscWalletButtonProps {
  style?: React.CSSProperties;
}

export const BscWalletButton: React.FC<BscWalletButtonProps> = ({ style }) => {
  const { publicKey, connected, connect, disconnect, isLoading } = useBscWallet();
  const [displayAddress, setDisplayAddress] = useState<string>('');

  useEffect(() => {
    if (publicKey) {
      // Format address for display (0x1234...5678)
      setDisplayAddress(`${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`);
    }
  }, [publicKey]);

  const handleConnect = async () => {
    console.log('BscWalletButton: Connecting to wallet...');
    try {
      await connect();
      console.log('BscWalletButton: Connection successful');
    } catch (error) {
      console.error('BscWalletButton: Connection error:', error);
    }
  };

  const handleDisconnect = async () => {
    console.log('BscWalletButton: Disconnecting wallet...');
    try {
      await disconnect();
      console.log('BscWalletButton: Disconnection successful');
    } catch (error) {
      console.error('BscWalletButton: Disconnect error:', error);
    }
  };

  const items = [
    {
      key: '1',
      label: 'Disconnect',
      icon: <DisconnectOutlined />,
      onClick: handleDisconnect,
    },
  ];

  if (!connected) {
    return (
      <Button
        type="primary"
        onClick={handleConnect}
        loading={isLoading}
        icon={<WalletOutlined />}
        style={{ ...style, borderRadius: '24px' }}
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button
        type="default"
        icon={<WalletOutlined />}
        style={{ ...style, borderRadius: '24px' }}
      >
        {displayAddress}
      </Button>
    </Dropdown>
  );
};

export default BscWalletButton;
