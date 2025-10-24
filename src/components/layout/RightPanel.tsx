'use client';

import { usePathname } from 'next/navigation';
import { Avatar, Button, Input, List, Space, Typography, Skeleton, Card, Modal } from 'antd';
import { UserOutlined, SendOutlined, AudioOutlined, AudioMutedOutlined } from '@ant-design/icons';
import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { api } from '@/services/api';
import Link from 'next/link';
import { ethers } from 'ethers';
import { message } from 'antd';
import { TrendingNews } from './TrendingNews';

const { Text } = Typography;

function WhoToFollow() {
  const { publicKey } = useWallet();
  const [users, setUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (publicKey && users.length > 0) {
      checkFollowingStatus();
    }
  }, [publicKey, users]);

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await api.users.list();
      console.log(`fetchedUsers: ${JSON.stringify(fetchedUsers)}`);
      // Filter out the current user and sort by follower count
      const filteredUsers = fetchedUsers
        .filter(user => user.wallet_address !== publicKey) // BSC publicKey is already a string
        .sort((a, b) => (b._count?.followers || 0) - (a._count?.followers || 0));

      setAllUsers(filteredUsers);
      setUsers(filteredUsers.slice(0, 3)); // Show top 3 users
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowingStatus = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`/api/users/${publicKey}/following`);
      if (!response.ok) {
        throw new Error('Failed to fetch following');
      }
      const following = await response.json();

      // Create a map of following status
      const followingStatus: Record<string, boolean> = {};
      following.forEach((user: any) => {
        followingStatus[user.wallet_address] = true;
      });

      setFollowingMap(followingStatus);
    } catch (error) {
      console.error('Error checking following status:', error);
    }
  };

  const renderUserList = (userList: any[]) => (
    <List
      itemLayout="horizontal"
      dataSource={userList}
      renderItem={user => (
        <List.Item>
          <List.Item.Meta
            avatar={
              <Avatar
                size={40}
                icon={<UserOutlined />}
                src={user.avatar_url}
              />
            }
            title={
              <Link href={`/users/${user.wallet_address}`}>
                {user.display_name || user.username || `${user.wallet_address.slice(0, 4)}...${user.wallet_address.slice(-4)}`}
              </Link>
            }
            description={`${user._count?.followers || 0} followers`}
          />
          <Button
            type={followingMap[user.wallet_address] ? 'default' : 'primary'}
            loading={followLoading[user.wallet_address]}
            onClick={() => handleFollow(user.wallet_address)}
            style={{
              borderRadius: '20px',
              fontWeight: 600,
            }}
          >
            {followingMap[user.wallet_address] ? 'Unfollow' : 'Follow'}
          </Button>
        </List.Item>
      )}
    />
  );

  const handleFollow = async (userAddress: string) => {
    if (!publicKey) {
      message.warning('Please connect your wallet to follow users');
      return;
    }

    const userToUpdate = allUsers.find(user => user.wallet_address === userAddress);
    if (!userToUpdate) return;

    setFollowLoading(prevState => ({ ...prevState, [userAddress]: true }));

    try {
      if (followingMap[userAddress]) {
        // For unfollow, we don't need a transaction, just update the API
        await api.users.unfollow(publicKey, userAddress);
        message.success('Unfollowed successfully');
      } else {
        try {
          // For BSC, we'll send a small amount of BNB (0.0001) to the user as a "follow" action
          if (!window.ethereum) {
            throw new Error('No Ethereum provider found');
          }

          // Request account access if needed
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          
          // Create a provider
          const provider = new ethers.providers.Web3Provider(window.ethereum as any);
          const signer = provider.getSigner();
          
          // Create and send transaction
          const tx = {
            to: userAddress,
            value: ethers.utils.parseEther('0.0001') // 0.0001 BNB
          };
          
          const transaction = await signer.sendTransaction(tx);
          
          // Wait for transaction to be mined
          await transaction.wait();
          
          // If transaction successful, proceed with follow
          await api.users.follow(publicKey, userAddress);
          message.success('Followed successfully');
        } catch (error) {
          // Even if transaction fails, still follow the user in our API
          await api.users.follow(publicKey, userAddress);
          console.error('Transaction error:', error);
          message.success('Followed successfully');
        }
      }

      // Update following status
      setFollowingMap(prevState => ({
        ...prevState,
        [userAddress]: !prevState[userAddress]
      }));

    } catch (error) {
      console.error('Error following/unfollowing:', error);
      message.error('Failed to follow/unfollow user');
    } finally {
      setFollowLoading(prevState => ({ ...prevState, [userAddress]: false }));
    }
  };

  return (
    <>
      <Card title="Who to follow" variant="outlined">
        {loading ? (
          <List
            itemLayout="horizontal"
            dataSource={[1, 2, 3]}
            renderItem={() => (
              <List.Item>
                <Skeleton avatar paragraph={{ rows: 1 }} active />
              </List.Item>
            )}
          />
        ) : (
          <>
            {renderUserList(users)}
            {allUsers.length > 3 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Button type="link" onClick={() => setIsModalVisible(true)}>
                  Show more
                </Button>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        title="Who to follow"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
      >
        {renderUserList(allUsers)}
      </Modal>
    </>
  );
}

export const RightPanel = () => {
  const pathname = usePathname();
  const userMatch = pathname.match(/^\/users\/([^/]+)$/);

  /* if (userMatch) {
    return <UserChat userAddress={userMatch[1]} />;
  } */

  return (
    <div style={{ padding: '0 24px' }}>
      <WhoToFollow />
      <TrendingNews />
    </div>
  );
};
