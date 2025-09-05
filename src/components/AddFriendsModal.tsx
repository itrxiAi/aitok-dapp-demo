import React, { useState, useEffect } from 'react';
import { Modal, Input, List, Avatar, Button, message, Spin } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';

const { Search } = Input;

interface User {
  wallet_address: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  _count?: {
    followers: number;
  };
  isFollowing?: boolean;
}

interface AddFriendsModalProps {
  visible: boolean;
  onClose: () => void;
  currentUserAddress?: string;
}

export const AddFriendsModal: React.FC<AddFriendsModalProps> = ({
  visible,
  onClose,
  currentUserAddress,
}) => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingInProgress, setFollowingInProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (visible && currentUserAddress) {
      fetchUsers();
    }
  }, [visible, currentUserAddress]);

  const fetchUsers = async () => {
    if (!currentUserAddress) return;
    
    setLoading(true);
    try {
      // Fetch all users
      const response = await fetch('/api/users');
      const allUsers = await response.json();
      
      // Fetch users the current user is following
      const followingResponse = await fetch(`/api/users/${currentUserAddress}/following`);
      const followingUsers = await followingResponse.json();
      const followingAddresses = followingUsers.map((user: User) => user.wallet_address);
      
      // Mark users that are already being followed
      const usersWithFollowingStatus = allUsers.map((user: User) => ({
        ...user,
        isFollowing: followingAddresses.includes(user.wallet_address),
      })).filter((user: User) => user.wallet_address !== currentUserAddress); // Exclude current user
      
      setUsers(usersWithFollowingStatus);
      setFilteredUsers(usersWithFollowingStatus);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => {
      const displayName = user.display_name?.toLowerCase() || '';
      const username = user.username?.toLowerCase() || '';
      const walletAddress = user.wallet_address.toLowerCase();
      const query = value.toLowerCase();
      
      return displayName.includes(query) || 
             username.includes(query) || 
             walletAddress.includes(query);
    });
    
    setFilteredUsers(filtered);
  };

  const handleFollow = async (userAddress: string) => {
    if (!currentUserAddress) return;
    
    setFollowingInProgress(prev => ({ ...prev, [userAddress]: true }));
    try {
      await api.users.follow(currentUserAddress, userAddress);
      
      // Update the user's following status in the list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.wallet_address === userAddress 
            ? { ...user, isFollowing: true } 
            : user
        )
      );
      
      setFilteredUsers(prevUsers => 
        prevUsers.map(user => 
          user.wallet_address === userAddress 
            ? { ...user, isFollowing: true } 
            : user
        )
      );
      
      message.success('User followed successfully');
    } catch (error) {
      console.error('Error following user:', error);
      message.error('Failed to follow user');
    } finally {
      setFollowingInProgress(prev => ({ ...prev, [userAddress]: false }));
    }
  };

  const handleUnfollow = async (userAddress: string) => {
    if (!currentUserAddress) return;
    
    setFollowingInProgress(prev => ({ ...prev, [userAddress]: true }));
    try {
      await api.users.unfollow(currentUserAddress, userAddress);
      
      // Update the user's following status in the list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.wallet_address === userAddress 
            ? { ...user, isFollowing: false } 
            : user
        )
      );
      
      setFilteredUsers(prevUsers => 
        prevUsers.map(user => 
          user.wallet_address === userAddress 
            ? { ...user, isFollowing: false } 
            : user
        )
      );
      
      message.success('User unfollowed successfully');
    } catch (error) {
      console.error('Error unfollowing user:', error);
      message.error('Failed to unfollow user');
    } finally {
      setFollowingInProgress(prev => ({ ...prev, [userAddress]: false }));
    }
  };

  const renderUserItem = (user: User) => (
    <List.Item
      key={user.wallet_address}
      actions={[
        user.isFollowing ? (
          <Button
            size="small"
            onClick={() => handleUnfollow(user.wallet_address)}
            loading={followingInProgress[user.wallet_address]}
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
            Unfollow
          </Button>
        ) : (
          <Button
            type="primary"
            size="small"
            onClick={() => handleFollow(user.wallet_address)}
            loading={followingInProgress[user.wallet_address]}
            style={{ 
              borderRadius: '16px',
              height: '28px',
              padding: '0 12px',
              fontWeight: 400,
              fontSize: '13px'
            }}
          >
            Follow
          </Button>
        )
      ]}
    >
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
          <a onClick={() => router.push(`/users/${user.wallet_address}`)}>
            {user.display_name || user.username || `${user.wallet_address.slice(0, 4)}...${user.wallet_address.slice(-4)}`}
          </a>
        }
        description={user.bio ? user.bio.substring(0, 60) + (user.bio.length > 60 ? '...' : '') : null}
      />
    </List.Item>
  );

  return (
    <Modal
      title="Add Friends"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Search
        placeholder="Search users by name or address"
        allowClear
        enterButton={<SearchOutlined />}
        size="large"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        onSearch={handleSearch}
        style={{ marginBottom: 16 }}
      />
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={filteredUsers}
          renderItem={renderUserItem}
          locale={{ emptyText: 'No users found' }}
        />
      )}
    </Modal>
  );
};
